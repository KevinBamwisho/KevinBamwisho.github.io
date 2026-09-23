# Decision log

---

## 1. What did you set out to build, and what changed?

I wanted to rebuild my portfolio as one page in plain HTML and CSS. My current portfolio in a different repo is an Astro site with a separate page for every project. The one new thing I really wanted was black and white flames around my headshot that flare up at random.

What the site has now: a hero with my photo, the flames, and links to GitHub, LinkedIn and my resume. Under that are Work (RIOT Sports, Qualcomm, EV charger siting), Projects (AlgoBowl, Clue), and The Hardwood Vault, a slideshow of basketball and snowboarding photos. It's dark by default, with a toggle for light.

**Dropped:** the Rail logistics card (Optimal Fleet Sizing). Currently working on this project and it's unfinished. I'm presenting a poster for this project at INFORMS 2026 annual conference.

**Changed:** The Hardwood Vault started as a column of photos you scroll past, with the text pinned beside it. I wanted it in one spot, not a list of images scrolling down. Now it shows one photo at a time and fades to the next every 5 seconds, with a play/pause button and dots to click through.

---

## 2. A fork in the road

**Plain HTML one-pager, or ship the Astro portfolio I already had.**

I already had a working portfolio at kevinbamwisho.me, built in Astro. The shortcut was to move it into this repo and deploy it with GitHub Actions. I actually switched to that plan partway through the night it was due, then came back.

I picked plain HTML, CSS and one JS file on a single page. There's no build step, so the files in the repo are exactly what Pages serves. React with Tailwind came up too, but nothing on this page has state, so it would have been a build step for nothing.

What I gave up: the per-project pages. On the Astro site every project has its own write-up. Here each one gets a short blurb, a picture, the stack and links, and the depth lives on GitHub and in my resume. I also gave up components, which one page doesn't really need.

Why I came back: moving the Astro site meant setting up Actions and making that repo's history public, and that history has files in it that shouldn't be public. The one-pager started in a clean repo.

---

## 3. Where you overruled the agent

One time Claude suggested, wrote, or claimed something and you did not take it.
What did it do? How did you notice? What did you do instead?

Claude originally wrote everything on the site. From the about page to the project paragraphs. I rewrote it all myself. I noticed it after reading the first draft. Another thing I noticed it added were these bolded white stats at the bottom of each card. It was pulling things from my resume and adding them at the bottom of cards where they don't belong and that's not what I wanted. I didn't want the page to be another resume.

Another time was the gallery section of course. Its initial design was bad so I came up with my own (decision log 2).

---

## 4. How you know it works

### How the agent knows it works:

I ran these in Playwright against the local page:

- **No sideways scroll at 375px wide or at 200% zoom.** Fails if anything is wider than the screen. The flame canvas is 1.8x the photo, so it's the likeliest thing to break it.
- **Reduced motion turned on means a blank flame canvas.** Fails if the script draws even one frame before checking the setting.
- **The theme I pick survives a reload.**
- **The flame canvas actually draws something.**

The last one taught me the most. The first version took one snapshot and failed even though the animation worked. Back then the effect was lightning, and each bolt lasted about 0.2 seconds, so a single snapshot usually landed between bolts. Sampling 300 frames fixed it (bolts showed up in 45). The screenshots also caught a real bug. I asked for black flames, but the page is dark by default, and black on black showed nothing. Now the flames are white in dark mode and black in light mode.

The check that counts is the live URL. On September 23 around 1 AM, `curl` on https://kevinbamwisho.github.io returned **200 OK with the template's "Hello, world." page**, because my work was on the `build-one-pager` branch and Pages deploys from `main`. So a check that only looks for a 200 passes on the wrong site. My live check has to find text only the new page has, like "The Hardwood Vault".

Proof is in [`verification/`](verification/).

**TODO before submitting:** merge to `main` and push, then fill `verification/` (screenshot with the URL bar, `curl -i` output in `fetch.txt`, and the three-line README).

### How I know it works

- ran `start index.html` to check site features and saw if everything I saw was what I expected. It was. Now just uploading it to github pages and writing up the verification folder.


---

## 5. What is still wrong

The flames are sized once, when the page loads. `script.js` reads the canvas width a single time, but the photo is 240px on desktop and 176px below 768px wide. If you load the page in a narrow window and then widen it, or rotate a tablet across that width, the canvas keeps its small bitmap and the browser stretches it, so the flames go blurry. I haven't checked how bad it looks.

Next I'd resize the canvas whenever its box changes size, with a `ResizeObserver`. To find out if it matters, I'd load the page at 375px in DevTools, drag it past 768px, and screenshot the hero before and after the fix.

- flame looks fine on readjustments
