# bunny Specification

## Purpose

A small Stanford bunny lives on the floor of every page as a hidden easter egg. It has simple
physics and a persistent personality: rough handling makes it scared, carrots and gentle play
make it trusting, and a trusting bunny plays with the cursor. Implemented in `site/assets/bunny2d.js`
(styles at the end of `site/assets/style.css`, sprite in `site/assets/bunny.png`).

## Requirements

### Requirement: Presence on every page
The bunny SHALL appear on every page of the site, standing on the floor: the bottom of the page,
not the bottom of the window. Its horizontal position SHALL carry over between pages within the
same browser tab.

#### Scenario: Long page
- **WHEN** a page is taller than the window
- **THEN** the bunny is only visible after scrolling to the bottom of the page

#### Scenario: Navigating
- **WHEN** the visitor moves from one page to another in the same tab
- **THEN** the bunny appears at the same horizontal position it had on the previous page

### Requirement: Appearance
The bunny SHALL be drawn from a pre-rendered clay sprite of the real Stanford bunny mesh, darkened
in dark mode, with a soft contact shadow under its feet. The shadow SHALL shrink and fade
as the bunny rises.

#### Scenario: Theme switch
- **WHEN** the visitor switches between light and dark mode
- **THEN** the bunny is shown lighter or darker to match

### Requirement: Physics
The bunny SHALL move with simple physics: gravity, a squash on landing proportional to impact, a
small bounce after hard landings, ground friction, and bouncing off the left and right window
edges at reduced speed. It SHALL face the direction it is moving.

#### Scenario: Hard landing
- **WHEN** the bunny lands fast
- **THEN** it squashes, bounces once more, and then slides to a stop

#### Scenario: Window edge
- **WHEN** the bunny reaches the left or right edge of the window while moving
- **THEN** it bounces back at about half speed and turns around

### Requirement: Tumbling when thrown
When thrown or dropped, the bunny SHALL tumble: it spins in the air, faster the harder it was
thrown, and bounces off the floor several times, losing height each bounce. It SHALL right itself
just before each impact so it always lands on its feet. Small final bounces SHALL not spin.

#### Scenario: Hard throw
- **WHEN** the visitor throws the bunny hard
- **THEN** it spins frantically in the air, bounces a few times on the floor, and every landing is upright

### Requirement: Grabbing and throwing
The visitor SHALL be able to pick the bunny up by pressing on it. While held, it SHALL dangle from
its ears and swing with the hand's sideways motion. On release it SHALL keep the hand's velocity.
A release after the hand has been still for more than 80 ms SHALL be a plain drop.

#### Scenario: Drop
- **WHEN** the visitor holds the bunny still in the air and lets go
- **THEN** it falls straight down under gravity

#### Scenario: Throw
- **WHEN** the visitor lets go while moving the hand
- **THEN** the bunny flies off with that velocity and follows a ballistic arc

### Requirement: Trust
The bunny SHALL keep a hidden trust value between -1 and 1, stored in the browser's localStorage
so it persists across visits. Trust determines its mood:
scared (below -0.35), neutral, or friendly (above 0.35).

#### Scenario: Returning visitor
- **WHEN** a visitor who befriended the bunny comes back later
- **THEN** the bunny still has the trust it had when they left

#### Scenario: Left alone
- **WHEN** the bunny has been left undisturbed for a while and trust is below 0.2
- **THEN** trust slowly recovers

### Requirement: Only rough handling costs trust
Handling the bunny SHALL only lower trust when it is rough. Rough means: a very fast throw, a drop
from very high up, slamming it into a window edge, grabbing it four or more times within 8
seconds, or throwing or dropping it while it is tired. The thresholds for "very fast" and "very
high" SHALL grow with trust, so a trusting bunny tolerates more. Being chased SHALL cost a very
small amount of trust.

#### Scenario: Gentle toss
- **WHEN** a neutral bunny is tossed gently
- **THEN** trust does not drop

#### Scenario: Rough throw
- **WHEN** the bunny is thrown very hard, at any trust level
- **THEN** trust drops noticeably and the bunny runs away after landing

### Requirement: Mood-dependent fleeing
The bunny SHALL hop away from a nearby cursor, away from the side the cursor approaches from.
How close the cursor may get SHALL depend on mood: scared bunnies flee from farther away with
bigger hops; neutral bunnies flee at moderate range; friendly bunnies only flee when the cursor
rushes at them. When cornered at a window edge it SHALL dodge past the cursor instead.

#### Scenario: Neutral
- **WHEN** the cursor gets close to a neutral bunny
- **THEN** it hops away from the side the cursor came from

### Requirement: Hiding when scared
A scared bunny SHALL react to the mouse position anywhere on the page, not only up close. It
SHALL run to the window corner farthest from the mouse and huddle there facing the wall. A scared
bunny switches corners when the mouse comes well over to its side; a terrified one stays in its
corner and only leaves when it thinks it is about to be caught. It SHALL shiver the whole time,
more strongly and faster the closer the mouse is.

#### Scenario: Mouse on the other side
- **WHEN** the mouse is on the right side of the page and the bunny is scared
- **THEN** the bunny runs to the left corner and shivers there

#### Scenario: Mouse approaches
- **WHEN** the mouse moves closer to a hiding scared bunny
- **THEN** its shivering becomes visibly stronger

### Requirement: Sprinting
For long runs (a scared bunny running to its corner, or escaping to the other corner), the bunny
SHALL sprint: it accelerates quickly and smoothly to a top speed while doing quick low strides
that keep their momentum, leans forward as it speeds up, and brakes in time to stop at its
destination.

#### Scenario: Running across the screen
- **WHEN** a scared bunny has to cross the whole window to reach its hiding corner
- **THEN** it reaches top speed within about half a second, slows down near the corner, and stops there

### Requirement: Cornered escape
When a scared bunny is hiding in a corner and it thinks it is about to be caught (the cursor is
very close, or closing in fast), it SHALL make a big leap past the cursor and sprint to the
opposite corner. It SHALL not bolt just because the mouse is somewhere nearby.

#### Scenario: Reaching into the corner
- **WHEN** the cursor moves along the floor into the corner where a scared bunny hides
- **THEN** the bunny leaps over or past the cursor and runs to the other corner

### Requirement: Terrified
Below a trust of -0.75 the bunny SHALL be terrified: it shakes all the time and cowers low, and
the closer the mouse gets, the more violently it shakes and the more often, higher and more
chaotically it jumps in panic. It is nearly impossible to catch. Most attempts to grab it SHALL fail as it squirms away, and if caught
it SHALL wriggle free within about half a second.

#### Scenario: Mouse creeping closer
- **WHEN** the mouse slowly approaches a terrified bunny in its corner
- **THEN** it stays in the corner but shakes harder and jumps around more and more wildly

#### Scenario: Trying to catch a terrified bunny
- **WHEN** the visitor repeatedly tries to grab a terrified bunny
- **THEN** most attempts fail, and any successful grab ends with it wriggling free almost at once

#### Scenario: Friendly, gentle approach
- **WHEN** the cursor slowly approaches a friendly bunny
- **THEN** the bunny stays where it is

### Requirement: Carrots
Pressing K SHALL drop a carrot from the cursor position; it falls with physics and lands on the
floor. On touch devices, after the carrot hint has been shown, tapping near the floor SHALL drop
one. Only one carrot SHALL exist at a time. The bunny SHALL go to a landed carrot and eat it in
three bites, which raises trust substantially. A scared bunny SHALL wait while the cursor is near
the carrot.

#### Scenario: Feeding
- **WHEN** a carrot lands and the cursor is away from it
- **THEN** the bunny hops to it, eats it, does a happy hop, and trust rises

### Requirement: Moving carrots
The visitor SHALL be able to pick up a carrot and put it somewhere else. Snatching it mid-meal
SHALL interrupt eating and cost a little trust.

#### Scenario: Moving the carrot
- **WHEN** the visitor picks up a landed carrot and drops it somewhere else
- **THEN** the carrot falls to the floor there and the bunny goes to the new spot

### Requirement: Carrot hint
After the visitor has played with the bunny (two grabs, or about six chase hops), a small line of
text SHALL appear near the bunny: "press K to drop a carrot" ("tap the floor to drop a carrot" on
touch devices). It SHALL be shown only once ever. No other hints SHALL be shown; everything else
is left to discover.

#### Scenario: First play session
- **WHEN** a new visitor grabs the bunny twice
- **THEN** the carrot hint fades in for a few seconds and never appears again

### Requirement: Petting
When the bunny is friendly, stroking it with the cursor (moving across it without clicking) SHALL
make it purr: a fine vibration with small "prr" and occasional heart bubbles floating up. Purring
SHALL raise trust slightly and stop shortly after the stroking stops. A bunny being petted SHALL
not flee. Petting is cursor-only (no touch equivalent).

#### Scenario: Stroke a friendly bunny
- **WHEN** the cursor passes slowly across a friendly bunny
- **THEN** it starts purring

#### Scenario: Stroke a neutral bunny
- **WHEN** the cursor moves onto a neutral bunny
- **THEN** it flees instead of purring

### Requirement: Friendly companionship
A friendly bunny SHALL hop over and sit next to a cursor that has been resting near the floor
for more than about a second, and turn to face it.

#### Scenario: Resting cursor
- **WHEN** the cursor rests near the floor a few hundred pixels from a friendly bunny
- **THEN** the bunny hops over, stops beside the cursor, and faces it

### Requirement: Energy
The bunny SHALL have an energy level that play drains and rest (a few seconds without play)
refills. A tired bunny SHALL stop playing, flail when picked up, and fall asleep much sooner.

#### Scenario: Played out
- **WHEN** the bunny has been tossed and played with many times in a row
- **THEN** it becomes tired, stops initiating play, and soon falls asleep

### Requirement: Playful mood
When trust is above 0.6 and the bunny has energy, it SHALL be playful and play with the cursor
when the cursor is near the floor:
it follows a slowly moving cursor along the floor; it crouches and pounces onto a cursor resting
nearby; it occasionally leapfrogs over a cursor resting right next to it. After a gentle toss, a
playful bunny SHALL enjoy it (trust rises slightly), wiggle, and hop back toward the cursor
instead of running away.

#### Scenario: Pounce
- **WHEN** the cursor rests near the floor about 50-260 px from a playful bunny
- **THEN** the bunny crouches, then jumps onto the cursor and wiggles

#### Scenario: Follow
- **WHEN** the cursor moves slowly along the floor near a playful bunny
- **THEN** the bunny hops after it

#### Scenario: Gentle toss when playful
- **WHEN** a playful bunny is tossed gently
- **THEN** trust rises slightly, energy drops, and after landing the bunny wiggles and comes back

### Requirement: Fetch
When a playful bunny sees a carrot that the visitor threw (released while moving), it SHALL sprint
to it, pick it up in its mouth, bring it back to where the visitor released it, drop it there, and
celebrate with a binky. It SHALL then wait a few seconds for another throw before eating it. After
three fetches of the same carrot it eats it. A carrot that was dropped rather than thrown is eaten
as usual. Grabbing the bunny while it carries a carrot makes it drop the carrot.

#### Scenario: Playing fetch
- **WHEN** the visitor throws a carrot while the bunny is playful
- **THEN** the bunny runs after it, brings it back to the visitor, and waits for the next throw

### Requirement: Binky
A happy bunny SHALL sometimes do a binky: an excited leap in one of several random variants: a
backflip, a frontflip, a mid-air twist, or a double hop. Flips and twists SHALL land upright. It
SHALL happen after eating a carrot, after bringing back a fetched carrot, and now and then at
random while playful.

#### Scenario: After a meal
- **WHEN** the bunny finishes eating a carrot
- **THEN** it does a binky (for example a backflip or a frontflip) and lands on its feet

### Requirement: Zoomies
Now and then, a playful bunny with plenty of energy that is not being interacted with SHALL get the
zoomies: three or four full-speed sprints from one side of the window to the other, then it
flops down in the middle, out of breath and with much less energy.

#### Scenario: Zoomies
- **WHEN** a playful, energetic bunny is left alone for a while
- **THEN** it occasionally races back and forth across the window and then flops down

### Requirement: Nudging
When the cursor sits still near the floor right next to a friendly or playful bunny for a few
seconds, the bunny SHALL nudge it: bump into it and wiggle, repeating every couple of seconds while
the cursor stays put.

#### Scenario: Idle cursor
- **WHEN** the visitor leaves the cursor resting beside a friendly bunny
- **THEN** the bunny bumps into it with a little wiggle, as if asking to play

### Requirement: Catching the cursor in the air
When the cursor rests up in the air near a playful bunny, the bunny SHALL leap up and try to catch
it at the top of its jump. The higher the jump, the longer and deeper it SHALL crouch to charge up
first, and the longer it rests before the next one. It can jump at most about 420 px: for a cursor
somewhat higher than that (up to about 750 px) it tries anyway, falls short, and slumps in
disappointment; for a cursor even higher it doesn't try and just looks up at it.

#### Scenario: Reachable cursor
- **WHEN** the cursor rests about 300 px above a playful bunny
- **THEN** the bunny crouches for a moment, then leaps up and reaches it

#### Scenario: Just out of reach
- **WHEN** the cursor rests about 600 px above a playful bunny
- **THEN** the bunny jumps as high as it can, falls short, and slumps briefly after landing

#### Scenario: Way out of reach
- **WHEN** the cursor rests far above the bunny (over about 750 px)
- **THEN** the bunny does not jump for it and just faces it

### Requirement: Sleeping
The bunny SHALL fall asleep after about 25 seconds without anything happening near it (about 6
seconds when tired), shown by a small floating "z". It SHALL wake when the cursor comes near,
when it is grabbed, or when a carrot lands.

#### Scenario: Waking up
- **WHEN** the cursor comes near a sleeping bunny
- **THEN** the "z" disappears and the bunny resumes its normal behavior

### Requirement: Idle life
When nothing else is going on, the bunny SHALL occasionally hop in place or shuffle a short
distance on its own.

#### Scenario: Quiet page
- **WHEN** the visitor is reading and not interacting
- **THEN** the bunny does a small hop every so often, without travelling far

### Requirement: Debug mode
Opening any page with `?debug` SHALL show a small developer panel (kept for the rest of the tab
session; `?debug=0` turns it off). It SHALL show the current mood and let the developer set trust
and energy with sliders, jump to a mood preset (terrified, scared, neutral, friendly, playful),
drop a carrot, trigger a binky or zoomies, put the bunny to sleep, or reset its memory. In debug
mode, `bunny.state` in the browser console SHALL give a read-only snapshot of its internal state.

#### Scenario: Testing a mood
- **WHEN** the developer opens a page with `?debug` and presses "terrified"
- **THEN** trust is set accordingly and the bunny immediately behaves as terrified

### Requirement: Reduced motion
When the visitor's system asks for reduced motion, the bunny SHALL stay still and SHALL not hop,
flee, or be thrown.

#### Scenario: Reduced motion enabled
- **WHEN** the visitor has "reduce motion" enabled
- **THEN** the bunny is shown standing still on the floor
