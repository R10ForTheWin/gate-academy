/* Oreo's GATE Academy — question content & generators (OLSAT-style practice).
   Pure functions, no DOM: loadable in the browser (window.OreoContent) and in Node for testing. */
(function (G) {
  'use strict';

  // ───────── helpers ─────────
  const rnd = n => Math.floor(Math.random() * n);
  const rint = (a, b) => a + rnd(b - a + 1);
  const pick = a => a[rnd(a.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  class Retry extends Error {}

  // Build a multiple-choice question. `wrong` is in priority order (most tempting first).
  function mc({ prompt, stem = '', correct, wrong, explain, hint = '', kind = 'text', count = 4, key = x => String(x), render = x => esc(x), shuffleWrong = false }) {
    const seen = new Set([key(correct)]);
    const pool = [];
    for (const w of (shuffleWrong ? shuffle(wrong) : wrong)) {
      const k = key(w);
      if (!seen.has(k)) { seen.add(k); pool.push(w); }
    }
    if (pool.length < count - 1) throw new Retry('not enough distractors');
    const opts = shuffle([correct, ...pool.slice(0, count - 1)]);
    return { prompt, stem, kind, options: opts.map(render), answer: opts.indexOf(correct), explain, hint };
  }

  const decks = {};
  function draw(id, bank) {
    if (!decks[id] || !decks[id].length) decks[id] = shuffle(bank.map((_, i) => i));
    return bank[decks[id].pop()];
  }

  // ───────── VERBAL BANKS ─────────
  // [word, opposite, wrong1, wrong2, wrong3, explanation]
  const ANTONYMS = [
    ['scarce', 'plentiful', 'rare', 'expensive', 'hidden', 'Scarce means there is very little of something. Plentiful means there is a lot. (Rare is a synonym — a trap!)'],
    ['reluctant', 'eager', 'slow', 'nervous', 'honest', 'Reluctant means not wanting to do something. Eager means really wanting to.'],
    ['transparent', 'opaque', 'clear', 'fragile', 'shiny', 'Transparent means you can see through it. Opaque means you cannot see through it.'],
    ['expand', 'contract', 'grow', 'explode', 'open', 'Expand means get bigger. Contract means get smaller.'],
    ['frugal', 'wasteful', 'poor', 'careful', 'greedy', 'Frugal means careful not to waste money. Wasteful is the reverse.'],
    ['ancient', 'modern', 'old', 'broken', 'famous', 'Ancient means from long, long ago. Modern means from now.'],
    ['hostile', 'friendly', 'angry', 'loud', 'foreign', 'Hostile means unfriendly or ready to fight.'],
    ['permanent', 'temporary', 'solid', 'lasting', 'fixed', 'Permanent means lasting forever. Temporary means only for a while.'],
    ['conceal', 'reveal', 'hide', 'protect', 'steal', 'Conceal means hide. Reveal means show.'],
    ['timid', 'bold', 'shy', 'quiet', 'small', 'Timid means shy and easily scared. Bold means brave and confident.'],
    ['vague', 'precise', 'cloudy', 'simple', 'quick', 'Vague means unclear or fuzzy. Precise means exact.'],
    ['inferior', 'superior', 'lower', 'weaker', 'interior', 'Inferior means lower in quality. Superior means higher. (Interior just sounds similar!)'],
    ['abundant', 'sparse', 'rich', 'huge', 'crowded', 'Abundant means plentiful. Sparse means thinly spread out — very little.'],
    ['complex', 'simple', 'difficult', 'tangled', 'clever', 'Complex means having many parts or being complicated. Simple is the opposite.'],
    ['humble', 'arrogant', 'modest', 'poor', 'gentle', 'Humble means not bragging. Arrogant means acting better than everyone.'],
    ['accelerate', 'decelerate', 'hurry', 'rush', 'steer', 'Accelerate means speed up. Decelerate means slow down.'],
    ['optimistic', 'pessimistic', 'hopeful', 'cheerful', 'realistic', 'Optimistic means expecting good things. Pessimistic means expecting bad things.'],
    ['vertical', 'horizontal', 'upright', 'tall', 'diagonal', 'Vertical means straight up and down. Horizontal means flat, side to side. Diagonal is slanted — not the opposite.'],
    ['ascend', 'descend', 'climb', 'rise', 'soar', 'Ascend means go up. Descend means go down.'],
    ['generous', 'stingy', 'kind', 'wealthy', 'giving', 'Generous means happy to share. Stingy means unwilling to share.'],
    ['victory', 'defeat', 'triumph', 'battle', 'trophy', 'A victory is a win. A defeat is a loss.'],
    ['novice', 'expert', 'beginner', 'student', 'child', 'A novice is a beginner. An expert is highly skilled.'],
    ['maximum', 'minimum', 'most', 'average', 'limit', 'Maximum is the greatest amount. Minimum is the least.'],
    ['include', 'exclude', 'contain', 'involve', 'invite', 'Include means let in. Exclude means leave out.'],
    ['praise', 'criticize', 'admire', 'reward', 'announce', 'Praise means say good things about. Criticize means point out faults.'],
    ['fertile', 'barren', 'muddy', 'green', 'farmed', 'Fertile land grows lots of plants. Barren land grows almost nothing.'],
  ];

  // [sentence with ___, correct, w1, w2, w3, explanation]
  const COMPLETIONS = [
    ['Because the hikers were ___ about the trail, they brought a detailed map.', 'uncertain', 'confident', 'excited', 'angry', '“Because” means the reason matches the result. You bring a map when you are NOT sure of the way.'],
    ['Although the puzzle looked simple, it was actually quite ___.', 'challenging', 'easy', 'colorful', 'small', '“Although” signals a switch: it LOOKED simple, but it was really the opposite — challenging.'],
    ['Maya was ___ after running the marathon, so she rested all afternoon.', 'exhausted', 'energetic', 'bored', 'early', '“So she rested” tells you the reason: she was exhausted.'],
    ['The scientist was ___ about her results, checking every number three times.', 'meticulous', 'careless', 'lazy', 'hasty', 'Checking every number three times shows she was meticulous — extremely careful.'],
    ['Unlike his talkative sister, Leo was ___ and rarely spoke in class.', 'reserved', 'chatty', 'popular', 'funny', '“Unlike his talkative sister” means Leo is the opposite of talkative: reserved.'],
    ['The ancient vase was ___, so the museum kept it behind glass.', 'fragile', 'sturdy', 'cheap', 'modern', 'You protect something behind glass when it breaks easily — fragile.'],
    ['The new rule was ___; people kept arguing about what it really meant.', 'ambiguous', 'clear', 'popular', 'short', 'If people argue about what it means, it can be read more than one way — ambiguous.'],
    ['Since the plant had not been watered for weeks, its leaves were ___.', 'withered', 'glossy', 'growing', 'healthy', 'No water for weeks makes leaves dry up and shrink — withered.'],
    ['The weather was so ___ that our picnic plans changed three times in one day.', 'unpredictable', 'pleasant', 'sunny', 'steady', 'Plans kept changing because no one could tell what the weather would do — unpredictable.'],
    ['Rather than ___ the problem, the team faced it head-on.', 'avoiding', 'solving', 'studying', 'discussing', '“Rather than” sets up an opposite. The opposite of facing a problem head-on is avoiding it.'],
    ['The documentary was ___; it taught us facts we had never heard before.', 'informative', 'boring', 'short', 'confusing', 'Teaching new facts means it was informative.'],
    ['Despite the heavy rain, the soccer game ___ as scheduled.', 'continued', 'stopped', 'was canceled', 'ended early', '“Despite” means something happened even though you would expect the opposite. The game went on anyway.'],
    ['The cat watched the bird with ___ attention, not moving a single whisker.', 'intense', 'little', 'sleepy', 'careless', 'Not moving a whisker shows very strong, focused attention — intense.'],
    ['Her answer was ___: it was short but still covered everything important.', 'concise', 'lengthy', 'incorrect', 'confusing', 'Short but complete is the meaning of concise.'],
    ['The ___ student finished early, while her ___ classmate needed extra time.', 'quick … slower', 'slow … faster', 'quiet … louder', 'tired … rested', '“While” sets up a contrast. Finishing early = quick; needing extra time = slower.'],
    ['The explorer kept a ___ journal, describing every single day in detail.', 'thorough', 'brief', 'fake', 'messy', 'Describing every day in detail means the journal was thorough — complete.'],
    ['After hours of ___ debate, the council finally reached an agreement.', 'lengthy', 'brief', 'silent', 'quick', '“After hours of” and “finally” tell you the debate was long — lengthy.'],
    ['The medicine ___ her headache, so she was able to finish her homework.', 'relieved', 'worsened', 'caused', 'ignored', 'She could finish her homework, so the headache got better — relieved.'],
    ['Oreo is usually ___, but when the treat bag rattles, Oreo sprints across the house.', 'lazy', 'speedy', 'hungry', 'playful', '“But” signals a contrast with sprinting. Usually Oreo is the opposite of fast: lazy.'],
    ['The museum guide gave a ___ explanation, so even the youngest visitors understood.', 'clear', 'puzzling', 'secret', 'tiny', 'If even young kids understood, the explanation was clear.'],
  ];

  // [sentence in natural order, position to ask (number, or 'last'), explanation extra]
  const ARRANGE = [
    ['Water boils at 212 degrees Fahrenheit', 4],
    ['My grandmother planted tomatoes in her garden', 'last'],
    ['The orchestra played a beautiful song for the audience', 5],
    ['Bees collect nectar from colorful flowers', 'last'],
    ['Oreo chased the red ball across the kitchen', 5],
    ['Thunder usually follows a flash of lightning', 3],
    ['The library closes early on Sundays', 3],
    ['Penguins cannot fly but they swim very well', 6],
    ['The moon reflects light from the sun', 3],
    ['Rose finished her science project before dinner', 4],
    ['Mountains are often colder at the top', 4],
    ['Every student needs a sharp pencil for the test', 'last'],
    ['Plants need sunlight and water to grow', 4],
    ['The brave firefighter rescued a kitten from the tree', 4],
  ];
  // Story order: sentences listed in the correct order
  const STORIES = [
    ['First, she mixed the flour, sugar, and eggs in a bowl.', 'Then she poured the batter into a pan.', 'Finally, she slid the pan into the oven.'],
    ['Rose found a lost puppy on her walk.', 'She called the phone number on its collar.', 'An hour later, the grateful owner arrived to take it home.'],
    ['The seed was planted in rich soil.', 'After a week of rain, a tiny sprout appeared.', 'By summer, it had grown into a tall sunflower.'],
    ['Oreo spotted a moth fluttering near the window.', 'Oreo crouched low and wiggled from side to side.', 'With one big leap, Oreo pounced — and missed!'],
    ['The class voted on a theme for the mural.', 'Next, they sketched their ideas on paper.', 'Then they painted the design on the wall.', 'At the assembly, the principal showed everyone the finished mural.'],
    ['Dark clouds rolled in over the beach.', 'Soon, thunder rumbled in the distance.', 'The lifeguard blew the whistle, and everyone left the water.'],
    ['Marco forgot his lunch at home.', 'At noon, his stomach started to growl.', 'His friend Jada noticed and shared half of her sandwich.', 'Marco promised to bring her a treat the next day.'],
    ['The caterpillar ate leaves for weeks.', 'Then it wrapped itself inside a chrysalis.', 'Inside, its body slowly changed.', 'At last, a butterfly crawled out and dried its wings.'],
    ['The team was losing by one goal at halftime.', 'In the second half, Priya passed the ball to Leo.', 'He kicked it past the goalie to tie the game.', 'In the final minute, Priya scored the winning goal.'],
  ];
  const PROPER = new Set(['Oreo', 'Rose', 'Fahrenheit', 'Sundays']);
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

  // [A, B, C, answer, w1, w2, w3, relationship]
  const ANALOGIES = [
    ['bird', 'nest', 'bee', 'hive', 'flower', 'honey', 'wasp', 'A bird lives in a nest. A bee lives in a hive.'],
    ['hot', 'cold', 'tall', 'short', 'high', 'giant', 'warm', 'Hot is the opposite of cold. Tall is the opposite of short.'],
    ['author', 'novel', 'composer', 'symphony', 'piano', 'orchestra', 'singer', 'An author creates a novel. A composer creates a symphony.'],
    ['glove', 'hand', 'sock', 'foot', 'shoe', 'leg', 'warm', 'A glove covers a hand. A sock covers a foot.'],
    ['puppy', 'dog', 'kitten', 'cat', 'mouse', 'kit', 'purr', 'A puppy grows up to be a dog. A kitten grows up to be a cat.'],
    ['pen', 'write', 'knife', 'cut', 'sharp', 'fork', 'kitchen', 'A pen is used to write. A knife is used to cut.'],
    ['fish', 'school', 'wolf', 'pack', 'den', 'howl', 'forest', 'A group of fish is a school. A group of wolves is a pack.'],
    ['thermometer', 'temperature', 'scale', 'weight', 'height', 'kitchen', 'number', 'A thermometer measures temperature. A scale measures weight.'],
    ['chapter', 'book', 'stanza', 'poem', 'pencil', 'rhyme', 'author', 'A chapter is a part of a book. A stanza is a part of a poem.'],
    ['drought', 'water', 'famine', 'food', 'hunger', 'rain', 'farm', 'A drought is a lack of water. A famine is a lack of food.'],
    ['carpenter', 'wood', 'sculptor', 'marble', 'statue', 'paint', 'museum', 'A carpenter works with wood. A sculptor works with marble.'],
    ['caterpillar', 'butterfly', 'tadpole', 'frog', 'pond', 'fish', 'egg', 'A caterpillar changes into a butterfly. A tadpole changes into a frog.'],
    ['whisper', 'shout', 'stroll', 'sprint', 'walk', 'legs', 'march', 'A shout is a much stronger whisper (quiet → loud). A sprint is a much stronger stroll (slow → fast).'],
    ['ear', 'hear', 'nose', 'smell', 'face', 'sneeze', 'eye', 'You hear with your ear. You smell with your nose.'],
    ['Monday', 'Tuesday', 'June', 'July', 'May', 'summer', 'month', 'Tuesday comes right after Monday. July comes right after June.'],
    ['calf', 'cow', 'foal', 'horse', 'pony', 'barn', 'saddle', 'A calf is a baby cow. A foal is a baby horse.'],
    ['car', 'gasoline', 'lamp', 'electricity', 'light', 'bulb', 'switch', 'A car runs on gasoline. A lamp runs on electricity.'],
    ['island', 'water', 'oasis', 'desert', 'palm', 'camel', 'well', 'An island is surrounded by water. An oasis is surrounded by desert.'],
    ['teacher', 'school', 'doctor', 'hospital', 'nurse', 'medicine', 'patient', 'A teacher works in a school. A doctor works in a hospital.'],
    ['ruler', 'length', 'clock', 'time', 'hands', 'alarm', 'wall', 'A ruler measures length. A clock measures time.'],
    ['seed', 'tree', 'egg', 'bird', 'nest', 'yolk', 'shell', 'A seed grows into a tree. An egg grows into a bird.'],
    ['begin', 'start', 'end', 'finish', 'middle', 'first', 'open', 'Begin means the same as start. End means the same as finish.'],
    ['cub', 'bear', 'joey', 'kangaroo', 'koala', 'pouch', 'Australia', 'A cub is a baby bear. A joey is a baby kangaroo.'],
    ['page', 'book', 'brick', 'wall', 'cement', 'house', 'builder', 'Many pages make up a book. Many bricks make up a wall.'],
    ['hungry', 'eat', 'tired', 'sleep', 'yawn', 'bed', 'awake', 'When you are hungry, you eat. When you are tired, you sleep.'],
    ['three', 'triangle', 'eight', 'octagon', 'square', 'circle', 'hexagon', 'A triangle has three sides. An octagon has eight sides.'],
  ];

  // [odd one, [four that belong], explanation]
  const CLASSIFY = [
    ['trumpet', ['violin', 'cello', 'guitar', 'harp'], 'Violin, cello, guitar and harp are string instruments. A trumpet is a brass instrument.'],
    ['Moon', ['Mercury', 'Venus', 'Mars', 'Jupiter'], 'Mercury, Venus, Mars and Jupiter are planets. The Moon is not a planet.'],
    ['circle', ['triangle', 'square', 'pentagon', 'hexagon'], 'The others are polygons with straight sides. A circle has no straight sides.'],
    ['shark', ['whale', 'dolphin', 'seal', 'otter'], 'Whales, dolphins, seals and otters are mammals. A shark is a fish.'],
    ['rose', ['oak', 'maple', 'pine', 'birch'], 'Oak, maple, pine and birch are trees. A rose is a flowering shrub.'],
    ['pound', ['inch', 'foot', 'mile', 'yard'], 'Inch, foot, mile and yard measure length. A pound measures weight.'],
    ['gloomy', ['happy', 'joyful', 'glad', 'cheerful'], 'The others all mean happy. Gloomy means sad.'],
    ['wood', ['copper', 'iron', 'gold', 'silver'], 'Copper, iron, gold and silver are metals. Wood is not.'],
    ['stroll', ['sprint', 'dash', 'race', 'rush'], 'The others mean moving fast. A stroll is slow.'],
    ['bat', ['eagle', 'penguin', 'ostrich', 'robin'], 'Eagles, penguins, ostriches and robins are birds (even the ones that cannot fly!). A bat flies but is a mammal.'],
    ['Mississippi', ['Pacific', 'Atlantic', 'Indian', 'Arctic'], 'The others are oceans. The Mississippi is a river.'],
    ['salt', ['ice', 'steam', 'snow', 'water'], 'Ice, steam, snow and water are all forms of water. Salt is not.'],
    ['recipe', ['thermometer', 'barometer', 'ruler', 'scale'], 'The others are tools for measuring. A recipe is a set of instructions.'],
    ['wink', ['mumble', 'whisper', 'shout', 'murmur'], 'The others are ways of speaking. A wink is done with your eye.'],
    ['spider', ['ant', 'beetle', 'butterfly', 'bee'], 'Ants, beetles, butterflies and bees are insects (six legs). A spider has eight legs — it is an arachnid.'],
    ['novel', ['sonnet', 'haiku', 'limerick', 'ballad'], 'Sonnets, haiku, limericks and ballads are kinds of poems. A novel is a long story.'],
    ['lovely', ['quickly', 'slowly', 'happily', 'quietly'], 'Tricky! The others are adverbs that describe HOW you do something. “Lovely” ends in -ly but it is an adjective.'],
    ['Tuesday', ['July', 'January', 'March', 'May'], 'The others are months. Tuesday is a day of the week.'],
    ['fog', ['rain', 'snow', 'sleet', 'hail'], 'Rain, snow, sleet and hail fall from the sky (precipitation). Fog is a cloud near the ground.'],
    ['square', ['cube', 'sphere', 'cylinder', 'pyramid'], 'Cubes, spheres, cylinders and pyramids are 3-D solids. A square is flat (2-D).'],
    ['elbow', ['heart', 'lungs', 'liver', 'brain'], 'Heart, lungs, liver and brain are organs. An elbow is a joint.'],
    ['nail', ['hammer', 'saw', 'wrench', 'screwdriver'], 'The others are tools you hold and use. A nail is a fastener that a tool puts in.'],
  ];

  // [thing, correct, w1..w4, explanation]
  const LOGICAL = [
    ['garden', 'plants', 'flowers', 'a fence', 'a gardener', 'vegetables', 'A vegetable garden may have no flowers, and a garden may have no fence — but every garden has plants.'],
    ['lake', 'water', 'fish', 'boats', 'ducks', 'sand', 'Some lakes have no fish, boats, ducks or sand. Every lake has water.'],
    ['shoe', 'a sole', 'laces', 'a buckle', 'leather', 'Velcro', 'Sandals have no laces; boots may have no buckle. Every shoe has a sole — the bottom part.'],
    ['circle', 'a center', 'corners', 'a color', 'straight edges', 'a label', 'A circle never has corners or straight edges, and may not be colored. It always has a center.'],
    ['game', 'rules', 'a ball', 'a board', 'a team', 'dice', 'Tag has no ball or board; chess has no team. Every game has rules.'],
    ['city', 'people', 'skyscrapers', 'a subway', 'a river', 'an airport', 'Plenty of cities have no subway, river or skyscrapers. Every city has people.'],
    ['bicycle', 'wheels', 'a basket', 'a bell', 'gears', 'a kickstand', 'Baskets, bells, gears and kickstands are extras. Every bicycle has wheels.'],
    ['desert', 'little rainfall', 'sand', 'cactuses', 'camels', 'heat', 'Antarctica is a desert — it is freezing, with no sand, camels or cactuses! What makes a desert is very little rain or snow.'],
    ['contest', 'competitors', 'prizes', 'judges', 'a trophy', 'an audience', 'Some contests have no prizes, judges or audience. A contest always has competitors.'],
    ['triangle', 'three angles', 'a right angle', 'equal sides', 'a point at the top', 'a color', 'Only some triangles have right angles or equal sides, and a triangle can be turned any way. Every triangle has three angles.'],
    ['mammal', 'a backbone', 'legs', 'a tail', 'fur', 'claws', 'Whales have no legs, people have no tail, and dolphins have almost no fur. Every mammal has a backbone.'],
    ['song', 'a melody', 'words', 'a guitar', 'a singer', 'a chorus', 'Some songs have no words or singer, and most have no guitar. Every song has a melody (a tune).'],
    ['library', 'books', 'computers', 'a café', 'a librarian at the door', 'magazines', 'A library may not have computers, a café or magazines. Every library has books.'],
    ['map', 'places', 'colors', 'a compass rose', 'oceans', 'roads', 'A map of a city park may have no oceans; a map may be black and white. Every map shows places.'],
  ];

  // [facts, correct, w1, w2, w3, explanation]
  const LOGIC = [
    ['All of Ms. Lee’s students play an instrument. Jamal is one of Ms. Lee’s students.', 'Jamal plays an instrument.', 'Jamal plays the piano.', 'Jamal is in the school band.', 'Jamal practices every day.', 'Jamal is in the group “Ms. Lee’s students,” and everyone in that group plays an instrument. We do NOT know which instrument, or anything else.'],
    ['No reptiles have fur. All snakes are reptiles.', 'No snakes have fur.', 'Some snakes have fur.', 'All reptiles are snakes.', 'Snakes are not reptiles.', 'Snakes are inside the “reptiles” circle, and nothing in that circle has fur.'],
    ['All bloops are razzies. All razzies are lazzies.', 'All bloops are lazzies.', 'All lazzies are bloops.', 'No bloops are lazzies.', 'All razzies are bloops.', 'Nonsense words make you use pure logic! Bloops fit inside razzies, which fit inside lazzies — so bloops are inside lazzies. It does not work backwards.'],
    ['If it rains, the game is canceled. The game was NOT canceled.', 'It did not rain.', 'It rained.', 'The game was moved inside.', 'It will rain tomorrow.', 'If rain always cancels the game, and the game wasn’t canceled, then it can’t have rained.'],
    ['Every red box is heavy. This box is not heavy.', 'This box is not red.', 'This box is red.', 'This box is blue.', 'All heavy boxes are red.', 'If it were red, it would have to be heavy. It isn’t heavy, so it isn’t red. (We don’t know what color it IS.)'],
    ['Some of the cats are black. All of the cats are friendly.', 'Some cats are both black and friendly.', 'All friendly animals are cats.', 'No black cats are friendly.', 'All of the cats are black.', 'Every cat is friendly — including the black ones. So some cats are black AND friendly.'],
    ['Only people with tickets may enter the concert. Sara entered the concert.', 'Sara had a ticket.', 'Sara bought her ticket today.', 'Sara is a musician.', 'Everyone with a ticket entered.', '“Only people with tickets” means no ticket, no entry. Sara got in, so she had a ticket.'],
    ['All squares are rectangles. Shape Q is not a rectangle.', 'Shape Q is not a square.', 'Shape Q is a square.', 'Shape Q is a circle.', 'All rectangles are squares.', 'Every square is a rectangle. Since Q is not a rectangle, it can’t be a square. (It might not be a circle, either!)'],
    ['Whenever Oreo hears the can opener, Oreo runs to the kitchen. Oreo has been asleep on the couch all afternoon.', 'Oreo did not hear the can opener this afternoon.', 'Oreo is not hungry.', 'The can opener is broken.', 'Oreo dislikes the kitchen.', 'If Oreo had heard it, Oreo would have run to the kitchen. Oreo stayed on the couch, so Oreo didn’t hear it.'],
    ['No one on the swim team is afraid of water. Kai is afraid of water.', 'Kai is not on the swim team.', 'Kai is on the swim team.', 'Kai cannot swim.', 'Kai is afraid of heights.', 'Everyone on the swim team is NOT afraid of water. Kai is, so Kai can’t be on the team. (Kai might still know how to swim!)'],
    ['Every student in the chess club also takes math club. Lena does not take math club.', 'Lena is not in the chess club.', 'Lena is in the chess club.', 'Lena does not like math.', 'Everyone in math club plays chess.', 'Chess club members are all inside math club. Lena is outside math club, so she is outside chess club too.'],
    ['Some fruits are red. All apples are fruits.', 'Apples might or might not be red.', 'All apples are red.', 'Some apples are red.', 'No apples are red.', 'Careful! “Some fruits are red” doesn’t tell us WHICH fruits. The red ones might all be strawberries. So we can’t be sure about apples either way.'],
  ];

  // ───────── VERBAL GENERATORS ─────────
  function genAntonym() {
    const [w, a, ...rest] = draw('antonym', ANTONYMS);
    const explain = rest.pop();
    return mc({ prompt: `Which word means the <b>opposite</b> of <span class="kw">${esc(w)}</span>?`, correct: a, wrong: rest, explain, shuffleWrong: true,
      hint: `First decide what “${esc(w)}” means. Then find the choice that means the reverse — not the same thing.` });
  }

  function genCompletion() {
    const [s, a, ...rest] = draw('completion', COMPLETIONS);
    const explain = rest.pop();
    const stem = `<p class="sentence">${esc(s).replace(/___/g, '<span class="blank"></span>')}</p>`;
    const cw = ['Although', 'Because', 'Despite', 'Unlike', 'Rather than', 'Since', 'while', 'but', ', so', 'After'].find(w => w === ', so' ? s.includes(w) : new RegExp(`\\b${w}\\b`).test(s));
    const hint = cw ? `Find the clue word “${cw.replace(', ', '').toLowerCase()}.” Does it keep the meaning going the same way, or flip it?` : 'Cover the choices and think of your own word for the blank first. Which clues in the sentence helped you?';
    return mc({ prompt: 'Which word or words best complete the sentence?', stem, correct: a, wrong: rest, explain, hint, shuffleWrong: true });
  }

  function genStory() {
    const story = draw('story', STORIES), n = story.length;
    const shown = shuffle(range(0, n - 1));            // shown[k] = index into story of the sentence labeled LET[k]
    const label = i => 'ABCD'[shown.indexOf(i)];       // label of story sentence i
    const fmt = perm => perm.map(label).join(' – ');
    const correct = fmt(range(0, n - 1));
    const perms = [];
    const permute = (arr, pre = []) => arr.length ? arr.forEach((x, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...pre, x])) : perms.push(pre);
    permute(range(0, n - 1));
    const swaps = perms.filter(p => p.filter((x, i) => x !== i).length === 2); // one swap away = most tempting
    const wrong = [...shuffle(swaps), ...shuffle(perms)].map(fmt);
    const stem = `<div class="story">${shown.map((i, k) => `<p><b>${'ABCD'[k]}</b> ${esc(story[i])}</p>`).join('')}</div>`;
    return mc({
      prompt: 'Which order of the sentences makes the <b>best story</b>?', stem, correct, wrong,
      hint: 'Look for time words like <i>first, then, soon, finally, at last</i> — and for words like <i>she, it,</i> or <i>they</i> that point back to something mentioned earlier.',
      explain: `The best order is <b>${correct}</b>: ${story.map(s => `“${esc(s)}”`).join(' → ')}`,
    });
  }

  function genArrange() {
    if (Math.random() < 0.45) return genStory();
    const [sentence, pos] = draw('arrange', ARRANGE);
    const words = sentence.split(' ');
    const idx = pos === 'last' ? words.length - 1 : pos - 1;
    const ans = words[idx];
    const show = w => PROPER.has(w) ? w : w.toLowerCase();
    let scrambled;
    do { scrambled = shuffle(words); } while (scrambled.join(' ') === words.join(' '));
    const stem = `<div class="wordbank">${scrambled.map(w => `<span>${esc(show(w))}</span>`).join('')}</div>`;
    const others = [...new Set(words.filter((w, i) => i !== idx && w.toLowerCase() !== ans.toLowerCase() && !['a', 'the', 'an'].includes(w.toLowerCase())).map(show))];
    const where = pos === 'last' ? 'LAST' : ORD[pos].toUpperCase();
    return mc({
      prompt: `If these words were put in order to make the best sentence, which word would come <b>${where}</b>?`,
      stem, correct: show(ans), wrong: shuffle(others), explain: `The sentence is: “${sentence}.” The ${pos === 'last' ? 'last' : ORD[pos]} word is “${show(ans)}.”`,
      hint: 'Find who or what the sentence is about, and what it does — those usually come first. Then build the rest and count.',
    });
  }

  function genAnalogy() {
    const [a, b, c, d, w1, w2, w3, explain] = draw('analogy', ANALOGIES);
    const stem = `<div class="analogy"><b>${esc(a)}</b> is to <b>${esc(b)}</b> as <b>${esc(c)}</b> is to <span class="blank"></span></div>`;
    return mc({ prompt: 'Which word completes the analogy?', stem, correct: d, wrong: [w1, w2, w3], explain,
      hint: `Make a sentence that connects “${esc(a)}” and “${esc(b)}.” Then use the very same sentence starting with “${esc(c)}.”` });
  }

  function genClassify() {
    const [odd, others, explain] = draw('classify', CLASSIFY);
    return mc({ prompt: 'Which word does <b>NOT</b> belong with the others?', correct: odd, wrong: others, explain, count: 5,
      hint: 'Find what four of the words have in common — and be as specific as you can. Sometimes the group is about grammar, not meaning.' });
  }

  function genLogical() {
    const [thing, a, ...rest] = draw('logical', LOGICAL);
    const explain = rest.pop();
    return mc({ prompt: `A <span class="kw">${esc(thing)}</span> <b>always</b> has…`, correct: a, wrong: rest, explain, count: 5,
      hint: `For each choice, ask: could there be a ${esc(thing)} <i>without</i> it? If yes, cross it out.` });
  }

  function genLogic() {
    const [facts, a, ...rest] = draw('logic', LOGIC);
    const explain = rest.pop();
    return mc({ prompt: 'If the statements are true, which of these <b>must</b> also be true?', stem: `<p class="facts">${esc(facts)}</p>`, correct: a, wrong: rest, explain,
      hint: 'Only use what the statements say, not what is usually true. Try drawing a circle for each group.' });
  }

  const NAMES = ['Ava', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Ivy', 'Jay', 'Kai', 'Lu', 'Max', 'Nia', 'Omar', 'Pia', 'Sam', 'Theo', 'Zoe'];
  const ATTRS = [
    { more: 'taller', less: 'shorter', most: 'tallest', least: 'shortest' },
    { more: 'older', less: 'younger', most: 'oldest', least: 'youngest' },
    { more: 'faster', less: 'slower', most: 'fastest', least: 'slowest' },
    { more: 'heavier', less: 'lighter', most: 'heaviest', least: 'lightest' },
  ];
  function genOrder() {
    const n = Math.random() < 0.45 ? 5 : 4;
    const ord = shuffle(NAMES).slice(0, n); // ord[0] = most
    const A = pick(ATTRS);
    const clues = [];
    for (let i = 0; i < n - 1; i++) {
      clues.push(Math.random() < 0.5 ? `${ord[i]} is ${A.more} than ${ord[i + 1]}.` : `${ord[i + 1]} is ${A.less} than ${ord[i]}.`);
    }
    const qt = pick(['most', 'least', 'second', 'secondLeast']);
    const qtext = { most: `Who is the <b>${A.most}</b>?`, least: `Who is the <b>${A.least}</b>?`, second: `Who is the <b>second ${A.most}</b>?`, secondLeast: `Who is the <b>second ${A.least}</b>?` }[qt];
    const ans = { most: ord[0], least: ord[n - 1], second: ord[1], secondLeast: ord[n - 2] }[qt];
    return mc({
      prompt: qtext, stem: `<p class="facts">${shuffle(clues).join(' ')}</p>`,
      correct: ans, wrong: ord.filter(x => x !== ans), count: n,
      hint: `Draw a ladder with the ${A.most} at the top. Place one clue at a time — and flip any “${A.less} than” clue before you place it.`,
      explain: `Line them up from ${A.most} to ${A.least}: <b>${ord.join(' → ')}</b>. Remember to flip “${A.less} than” clues around.`,
    });
  }

  const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function genLetters() {
    const fam = pick(['skip', 'back', 'grow', 'alt', 'pairs', 'double', 'matrix', 'matrix']);
    let shown, ans, explain, wrong = [], hint = 'Turn the letters into numbers (A=1, B=2, C=3…) and look at the jumps.';
    const L = i => AZ[i];
    const num = i => `${AZ[i]}(${i + 1})`;
    if (fam === 'skip') {
      const k = rint(2, 4), s = rint(0, 25 - 5 * k);
      const seq = range(0, 5).map(i => s + k * i);
      shown = seq.slice(0, 5).map(L); ans = L(seq[5]);
      wrong = [L(seq[5] - 1), L(seq[5] + 1 <= 25 ? seq[5] + 1 : seq[5] - 2), L(seq[4] + k + 2 <= 25 ? seq[4] + k + 2 : seq[4] - 1), L(seq[4] + 1)];
      explain = `Turn letters into numbers: ${seq.slice(0, 5).map(num).join(', ')}. Each letter jumps ahead ${k}. ${L(seq[4])} + ${k} = <b>${ans}</b>.`;
    } else if (fam === 'back') {
      const k = rint(2, 4), s = rint(5 * k, 25);
      const seq = range(0, 5).map(i => s - k * i);
      shown = seq.slice(0, 5).map(L); ans = L(seq[5]);
      wrong = [L(seq[5] + 1), L(Math.max(0, seq[5] - 1) === seq[5] ? seq[5] + 2 : seq[5] - 1), L(seq[4] + k), L(seq[4] - 1)];
      explain = `Turn letters into numbers: ${seq.slice(0, 5).map(num).join(', ')}. Each letter goes back ${k}. ${L(seq[4])} − ${k} = <b>${ans}</b>.`;
    } else if (fam === 'grow') {
      const s = rint(0, 10);
      const seq = [0, 1, 3, 6, 10, 15].map(x => s + x);
      shown = seq.slice(0, 5).map(L); ans = L(seq[5]);
      wrong = [L(seq[5] - 1), L(seq[4] + 4), L(seq[5] + 1), L(seq[5] - 2)];
      explain = `The jumps grow: +1, +2, +3, +4… so the next jump is +5. ${L(seq[4])} + 5 = <b>${ans}</b>.`;
    } else if (fam === 'alt') {
      const p = rint(2, 4), s = rint(0, 10);
      const seq = [s]; for (let i = 1; i < 7; i++) seq.push(seq[i - 1] + (i % 2 ? p : -1));
      shown = seq.slice(0, 6).map(L); ans = L(seq[6]);
      wrong = [L(seq[6] - 1), L(seq[5] - 1), L(seq[6] + 1), L(seq[5] + p + 1)];
      explain = `The pattern alternates: forward ${p}, back 1, forward ${p}, back 1… The next step is forward ${p}: ${L(seq[5])} + ${p} = <b>${ans}</b>.`;
    } else if (fam === 'pairs') {
      const s = rint(0, 8);
      const P = i => L(s + i) + L(25 - s - i);
      shown = range(0, 3).map(P); ans = P(4);
      wrong = [L(s + 4) + L(24 - s - 4), L(s + 5) + L(25 - s - 4), L(s + 4) + L(26 - s - 4), L(s + 3) + L(25 - s - 4), L(s + 5) + L(24 - s - 4)];
      hint = 'Look at the first letters and the second letters separately.';
      explain = `The first letters go forward (${range(0, 4).map(i => L(s + i)).join(', ')}…). The second letters go backward from the end of the alphabet (${range(0, 4).map(i => L(25 - s - i)).join(', ')}…). Next: <b>${ans}</b>.`;
    } else if (fam === 'matrix') {
      const a = pick([1, 2]), b = pick([3, 4]), s = rint(0, 25 - 2 * a - 2 * b - 1);
      const x = (r, c) => s + a * c + b * r, cell = (r, c) => L(x(r, c)) + L(x(r, c) + 1);
      ans = cell(2, 2); const X = x(2, 2);
      wrong = [L(X + 1) + L(X + 2), L(X - 1) + L(X), L(X) + L(X + 2), cell(2, 1), cell(1, 2), L(X + 2) + L(X + 3)];
      let cells = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells += r === 2 && c === 2 ? '<span class="q">?</span>' : `<span>${cell(r, c)}</span>`;
      return mc({ prompt: 'Which letters belong where the question mark is?', stem: `<div class="nummatrix letters">${cells}</div>`, correct: ans, count: 5, shuffleWrong: true,
        wrong: wrong.filter(w => /^[A-Z]{2}$/.test(w)),
        hint: 'Look at how the letters change as you move across a row. Then look at how they change as you move down a column.',
        explain: `Moving across a row, each pair moves ${a} letter${a > 1 ? 's' : ''} forward (${cell(0, 0)} → ${cell(0, 1)}). Moving down a column, each pair moves ${b} letters forward (${cell(0, 0)} → ${cell(1, 0)}). So the missing pair is <b>${ans}</b>.` });
    } else {
      const k = pick([3, 4]), s = rint(0, 4);
      const P = i => L(s + k * i) + L(s + k * i + 1);
      shown = range(0, 3).map(P); ans = P(4);
      wrong = [L(s + 4 * k) + L(s + 4 * k + 2), L(s + 4 * k + 1) + L(s + 4 * k + 2), L(s + 4 * k - 1) + L(s + 4 * k), L(s + 3 * k + 2) + L(s + 3 * k + 3)];
      explain = `Each pair is two letters in a row, and each pair starts ${k} letters after the one before. Next: <b>${ans}</b>.`;
    }
    const stem = `<div class="numrow letters">${shown.map(x => `<span>${x}</span>`).join('')}<span class="q">?</span></div>`;
    return mc({ prompt: 'Which letter or letters come next?', stem, correct: ans, hint, wrong: wrong.filter(x => typeof x === 'string' && /^[A-Z]+$/.test(x)), explain, count: 5, shuffleWrong: true });
  }

  function fmtTime(t) { // minutes after noon
    const h = Math.floor(t / 60) % 12 || 12, m = t % 60;
    return `${h}:${String(m).padStart(2, '0')} PM`;
  }
  const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  function genArith() {
    const t = rnd(10);
    let p, ans, wrong, explain, f = x => String(x);
    if (t === 0) {
      const h = rint(9, 16), w = rint(2, 4);
      p = `Oreo naps ${h} hours every day. How many hours does Oreo nap in ${w} weeks?`;
      ans = h * 7 * w; wrong = [h * w, h * 7, h * 5 * w, h * 7 * w + h, h * 7 * w - 7];
      explain = `${w} weeks = ${w} × 7 = ${7 * w} days. ${7 * w} × ${h} = <b>${ans}</b> hours. (Did you remember to change weeks into days?)`;
    } else if (t === 1) {
      const n1 = pick([2, 3, 4, 5]), u = rint(2, 6), n2 = n1 * rint(3, 6);
      p = `${n1} notebooks cost ${money(n1 * u)}. At the same price, how much do ${n2} notebooks cost?`;
      ans = u * n2; wrong = [n1 * u * n2, n1 * u + (n2 - n1), u * n2 - u, u * n2 + u, u * n2 + n1]; f = money;
      explain = `One notebook costs ${money(n1 * u)} ÷ ${n1} = ${money(u)}. So ${n2} cost ${n2} × ${money(u)} = <b>${money(ans)}</b>.`;
    } else if (t === 2) {
      const a = pick([2, 3, 4, 5]), b = pick([2, 3, 4].filter(x => x !== a)), P = a * b * rint(4, 12);
      const r1 = P - P / a, r2 = r1 - r1 / b;
      p = `A book has ${P} pages. Rose reads 1/${a} of the book on Monday. On Tuesday she reads 1/${b} of the pages that are <b>left</b>. How many pages does she still have to read?`;
      ans = r2; wrong = [P - P / a - P / b, r1, r1 / b, P / a, r2 + P / a];
      explain = `Monday: ${P} ÷ ${a} = ${P / a} pages, leaving ${r1}. Tuesday: 1/${b} of ${r1} = ${r1 / b}, leaving <b>${r2}</b>. The trap is taking 1/${b} of the whole book.`;
    } else if (t === 3) {
      const s = rint(1, 7) * 60 + rint(0, 11) * 5, d = rint(1, 2) * 60 + rint(1, 11) * 5;
      p = `A movie starts at ${fmtTime(s)} and lasts ${Math.floor(d / 60)} hour${d >= 120 ? 's' : ''} ${d % 60} minutes. What time does it end?`;
      ans = fmtTime(s + d);
      wrong = [fmtTime(s + d - 60), fmtTime(s + d + 60), fmtTime(s + d - 10), fmtTime(s + d + 10), fmtTime(s + d + 30)];
      explain = `Add the hours, then the minutes: ${fmtTime(s)} + ${Math.floor(d / 60)} h = ${fmtTime(s + Math.floor(d / 60) * 60)}, then + ${d % 60} min = <b>${ans}</b>. Watch out when the minutes go past 60!`;
    } else if (t === 4) {
      const jo = rint(5, 14), d = rint(2, 7), S = 2 * jo + d;
      p = `Mia is ${d} years older than Jo. Their ages add up to ${S}. How old is Mia?`;
      ans = jo + d; wrong = [jo, S / 2, S - d, jo + 2 * d, ans + 1];
      explain = `Take away the extra ${d} years: ${S} − ${d} = ${S - d}. Split it evenly: Jo is ${jo}. Mia is ${jo} + ${d} = <b>${ans}</b>.`;
    } else if (t === 5) {
      const w = rint(2, 9), P = 6 * w;
      p = `A rectangle is twice as long as it is wide. Its perimeter is ${P} cm. What is its area in square cm?`;
      ans = 2 * w * w; wrong = [w * w, 3 * w, P, 4 * w * w, 2 * w * w + w];
      explain = `The perimeter is width + length + width + length = w + 2w + w + 2w = 6w. So 6w = ${P}, and w = ${w}. The length is ${2 * w}. Area = ${w} × ${2 * w} = <b>${ans}</b>.`;
    } else if (t === 6) {
      const pct = pick([10, 20, 25, 40, 50, 75]), price = 20 * rint(2, 9);
      p = `A jacket costs ${money(price)}. It is on sale for ${pct}% off. What is the sale price?`;
      ans = price * (100 - pct) / 100; f = money;
      wrong = [price * pct / 100, price - pct, price * (100 + pct) / 100, ans - 5, ans + 5];
      explain = `${pct}% of ${money(price)} is ${money(price * pct / 100)}. ${money(price)} − ${money(price * pct / 100)} = <b>${money(ans)}</b>. (The trap is choosing the discount instead of the price!)`;
    } else if (t === 7) {
      const avg = rint(80, 92); let a, b, c, need;
      do { a = rint(avg - 12, avg + 8); b = rint(avg - 12, avg + 8); c = rint(avg - 12, avg + 8); need = 4 * avg - a - b - c; } while (need > 100 || need < 60);
      p = `Rose scored ${a}, ${b}, and ${c} on three quizzes. What does she need on the fourth quiz to have an average of exactly ${avg}?`;
      ans = need; wrong = [avg, 3 * avg - a - b - c + avg, need + 4, need - 4, need + 1];
      explain = `An average of ${avg} over 4 quizzes means a total of 4 × ${avg} = ${4 * avg}. She has ${a} + ${b} + ${c} = ${a + b + c}. She needs ${4 * avg} − ${a + b + c} = <b>${need}</b>.`;
    } else if (t === 8) {
      const x = rint(2, 4), y = rint(x + 1, 7), k = rint(3, 8), T = (x + y) * k;
      p = `In a pet shelter, the ratio of cats to dogs is ${x} to ${y}. There are ${T} cats and dogs in all. How many cats are there?`;
      ans = x * k; wrong = [y * k, T / x, T - x, x * k + x, T / 2];
      explain = `${x} : ${y} means for every ${x + y} animals, ${x} are cats. ${T} ÷ ${x + y} = ${k} groups. ${k} × ${x} = <b>${ans}</b> cats.`;
    } else {
      const s = pick([4, 5, 6, 8, 10, 12, 15]), m = pick([20, 30, 40, 45, 90]), d = s * m / 60;
      if (!Number.isInteger(d)) return genArith();
      p = `Rose bikes at a steady speed of ${s} miles per hour. How many minutes will it take her to bike ${d} miles?`;
      ans = m; wrong = [d * s, Math.round(60 / s * d) + 10, m - 10, m + 15, s + d];
      explain = `${s} miles per hour means 1 mile takes 60 ÷ ${s} = ${60 / s} minutes. ${d} × ${60 / s} = <b>${ans}</b> minutes.`;
    }
    const HINTS = ['How many days are in that many weeks?', 'How much does ONE notebook cost?', 'Tuesday’s fraction is of the pages LEFT after Monday — not of the whole book.', 'Add the hours first, then the minutes. What happens when the minutes go past 60?', 'If Mia weren’t older, they’d be the same age. Take away the difference first.', 'Call the width w. Then the length is 2w. What is the perimeter in terms of w?', 'Find the discount first. Is the question asking for the discount or the new price?', 'What TOTAL do four quiz scores need to reach that average?', 'How many animals are in one group of cats-and-dogs together?', 'How many minutes does it take to bike ONE mile?'];
    return mc({ prompt: p, correct: ans, wrong: wrong.filter(v => v > 0 || typeof v === 'string'), explain, hint: HINTS[t], count: 5, render: v => esc(f(v)), key: v => f(v) });
  }

  // ───────── FIGURES (SVG) ─────────
  const INK = '#2d2a3e';
  const FILLS = { white: '#ffffff', black: INK, gray: '#b6bfcf' };
  const SYM = { circle: 0, square: 90, triangle: 120, pentagon: 72, hexagon: 60, heptagon: 360 / 7, octagon: 45, star: 72, diamond: 180, cross: 90, arrow: 360, flag: 360 };
  const SIDES = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 };
  const f2 = n => (+n).toFixed(2).replace(/\.?0+$/, '');
  function polyPts(n, r) {
    const p = [];
    for (let k = 0; k < n; k++) { const t = (-90 + 360 * k / n) * Math.PI / 180; p.push(f2(r * Math.cos(t)) + ',' + f2(r * Math.sin(t))); }
    return p.join(' ');
  }
  function shapeEl(s, r) {
    switch (s) {
      case 'circle': return `<circle r="${f2(r)}"/>`;
      case 'square': { const h = r * 0.8; return `<rect x="${f2(-h)}" y="${f2(-h)}" width="${f2(2 * h)}" height="${f2(2 * h)}"/>`; }
      case 'triangle': return `<polygon points="${polyPts(3, r * 1.1)}"/>`;
      case 'pentagon': case 'hexagon': case 'heptagon': case 'octagon': return `<polygon points="${polyPts(SIDES[s], r)}"/>`;
      case 'diamond': return `<polygon points="0,${f2(-r)} ${f2(r * 0.68)},0 0,${f2(r)} ${f2(-r * 0.68)},0"/>`;
      case 'star': {
        const p = [];
        for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.45 : r, t = (-90 + 36 * k) * Math.PI / 180; p.push(f2(rr * Math.cos(t)) + ',' + f2(rr * Math.sin(t))); }
        return `<polygon points="${p.join(' ')}"/>`;
      }
      case 'cross': { const w = r * 0.34; return `<polygon points="${[[-w, -r], [w, -r], [w, -w], [r, -w], [r, w], [w, w], [w, r], [-w, r], [-w, w], [-r, w], [-r, -w], [-w, -w]].map(([x, y]) => f2(x) + ',' + f2(y)).join(' ')}"/>`; }
      case 'arrow': return `<polygon points="0,${f2(-r)} ${f2(0.62 * r)},${f2(-0.12 * r)} ${f2(0.24 * r)},${f2(-0.12 * r)} ${f2(0.24 * r)},${f2(r)} ${f2(-0.24 * r)},${f2(r)} ${f2(-0.24 * r)},${f2(-0.12 * r)} ${f2(-0.62 * r)},${f2(-0.12 * r)}"/>`;
      case 'flag': return `<path d="M${f2(-0.5 * r)},${f2(r)} V${f2(-r)} H${f2(-0.26 * r)} L${f2(0.72 * r)},${f2(-0.58 * r)} L${f2(-0.26 * r)},${f2(-0.16 * r)} V${f2(r)} Z"/>`;
    }
    throw new Error('unknown shape ' + s);
  }
  function primEl(p) {
    const r = p.r ?? 32;
    return `<g transform="translate(${f2(p.x ?? 50)} ${f2(p.y ?? 50)}) rotate(${f2(p.a || 0)})${p.m ? ' scale(-1 1)' : ''}" fill="${FILLS[p.f || 'white']}" stroke="${INK}" stroke-width="${r < 12 ? 2 : 3}" stroke-linejoin="round">${shapeEl(p.s, r)}</g>`;
  }
  function renderFig(prims) {
    return `<svg viewBox="0 0 100 100" class="fig" aria-hidden="true">${prims.map(primEl).join('')}</svg>`;
  }
  function normPrim(p) {
    let a = (((p.a || 0) % 360) + 360) % 360;
    const sym = SYM[p.s];
    if (sym === 0) a = 0; else { a = a % sym; if (sym - a < 0.5) a = 0; }
    const m = p.s === 'flag' && p.m ? 1 : 0; // every other shape is mirror-symmetric
    return [p.s, Math.round(p.x ?? 50), Math.round(p.y ?? 50), Math.round(p.r ?? 32), p.f || 'white', a.toFixed(0), m].join(':');
  }
  const figKey = prims => prims.map(normPrim).sort().join('|');
  const box = (html, cls = '') => `<div class="fbox ${cls}">${html}</div>`;
  const qbox = () => box('?', 'q');

  function rowLayout(n) {
    const rows = n <= 3 ? [n] : n === 4 ? [2, 2] : n === 5 ? [3, 2] : n === 6 ? [3, 3] : n === 7 ? [4, 3] : [4, 4];
    const gap = 23, pts = [], H = (rows.length - 1) * gap;
    rows.forEach((cnt, ri) => { const W = (cnt - 1) * gap; for (let k = 0; k < cnt; k++) pts.push([50 - W / 2 + k * gap, 50 - H / 2 + ri * gap]); });
    return pts;
  }
  const group = (s, n, f, r = 9) => rowLayout(n).map(([x, y]) => ({ s, x, y, r, f }));
  function dotRing(n, R) {
    if (n === 1) return [{ s: 'circle', r: 4.5, f: 'black' }];
    return range(0, n - 1).map(k => { const t = (-90 + 360 * k / n) * Math.PI / 180; return { s: 'circle', x: 50 + R * Math.cos(t), y: 50 + R * Math.sin(t), r: 4.5, f: 'black' }; });
  }
  const plural = (s, n) => n === 1 ? s : s + 's';

  function figMC(o) { return mc({ ...o, kind: 'fig', count: 5, key: figKey, render: renderFig }); }

  function genFigSeries() {
    const fam = pick(['rotate', 'corner', 'count', 'sides']);
    let frames, correct, wrong, explain;
    const hint = { rotate: 'Watch which way the shape points in each picture. Which way is it turning, and how far?', corner: 'Follow ONLY the black dot first. Then follow ONLY the gray triangle.', count: 'Count the shapes in each picture. Then look at their color.', sides: 'Count the sides of each shape. And watch the shading too!' }[fam];
    if (fam === 'rotate') {
      const s = pick(['arrow', 'flag']), step = pick([45, 90, -45, -90, 135, -135]), a0 = pick([0, 45, 90, 135, 180, 225, 270, 315]), f = pick(['white', 'gray', 'black']);
      const fr = (i, extra = {}) => [{ s, r: 36, f, a: a0 + step * i, ...extra }];
      const A4 = a0 + step * 4;
      frames = range(0, 3).map(i => fr(i)); correct = fr(4);
      wrong = [fr(5), fr(3), fr(4, { a: A4 + 180 }), fr(4, { a: A4 + 90 }), fr(4, { a: A4 - 90 }), fr(4, { a: A4 + 45 }), fr(4, { a: A4 - 45 })];
      if (s === 'flag') wrong.unshift(fr(4, { m: true }));
      const turn = { 45: 'an eighth of a turn', 90: 'a quarter turn', 135: 'three eighths of a turn' }[Math.abs(step)];
      explain = `The ${s} turns ${turn} (${Math.abs(step)}°) ${step > 0 ? 'clockwise' : 'counter-clockwise'} each time. Turn the last picture one more time.${s === 'flag' ? ' Watch out for the flipped (mirror-image) flag!' : ''}`;
    } else if (fam === 'corner') {
      const C = [[31, 31], [69, 31], [69, 69], [31, 69]], E = [[50, 28], [72, 50], [50, 72], [28, 50]];
      const d0 = rnd(4), ds = pick([1, 3]), t0 = rnd(4), ts = pick([1, 2, 3].filter(x => x !== ds));
      const fr = (dc, te) => [{ s: 'square', r: 40, f: 'white' }, { s: 'circle', x: C[dc][0], y: C[dc][1], r: 6, f: 'black' }, { s: 'triangle', x: E[te][0], y: E[te][1], r: 7, f: 'gray', a: te * 90 }];
      const D = i => (d0 + ds * i) % 4, T = i => (t0 + ts * i) % 4;
      frames = range(0, 2).map(i => fr(D(i), T(i))); correct = fr(D(3), T(3));
      wrong = shuffle([fr(D(3), T(2)), fr(D(2), T(3)), fr(D(4), T(3)), fr(D(3), T(4)), fr(D(2), T(2)), fr((D(3) + 2) % 4, T(3)), fr(D(3), (T(3) + 2) % 4)]);
      const tri = ts === 2 ? 'jumps to the opposite side' : `moves ${ts === 1 ? 'clockwise' : 'counter-clockwise'} one side`;
      explain = `Follow each piece on its own. The black dot moves ${ds === 1 ? 'clockwise' : 'counter-clockwise'} one corner each time. The gray triangle ${tri} each time.`;
    } else if (fam === 'count') {
      const s = pick(['circle', 'square', 'triangle', 'star', 'diamond']), c0 = pick([1, 2]);
      const fills = pick([['white', 'black'], ['black', 'gray'], ['white', 'gray', 'black']]);
      const n = i => c0 + i, f = i => fills[i % fills.length];
      frames = range(0, 3).map(i => group(s, n(i), f(i))); correct = group(s, n(4), f(4));
      const other = ['white', 'gray', 'black'].find(x => x !== f(4) && x !== f(3));
      wrong = [group(s, n(4), f(3)), group(s, n(5), f(4)), group(s, n(3), f(4)), group(s, n(4), other), group(s, n(5), f(3)), group(s, n(3), f(3))];
      explain = `Two things change. Each picture has one more ${s} than the one before, and the color repeats ${fills.join(' → ')}. So the next picture has <b>${n(4)} ${f(4)} ${s}s</b>.`;
    } else {
      const SH = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'], FL = ['white', 'gray', 'black'];
      const up = Math.random() < 0.6, k0 = rnd(3);
      const idx = up ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
      const F = i => FL[(k0 + i) % 3];
      const fr = (j, f) => [{ s: SH[j], r: 36, f }];
      frames = range(0, 3).map(i => fr(idx[i], F(i))); correct = fr(idx[4], F(4));
      wrong = [fr(idx[4], F(3)), fr(idx[4], F(5)), fr(idx[5], F(4)), fr(idx[3], F(4)), fr(idx[5], F(5))];
      explain = `Each shape has one ${up ? 'more' : 'fewer'} side than the one before (${range(0, 3).map(i => SIDES[SH[idx[i]]]).join(', ')}…), and the shading repeats white → gray → black. Next: a <b>${F(4)} ${SH[idx[4]]}</b> with ${SIDES[SH[idx[4]]]} sides.`;
    }
    return figMC({ prompt: 'Which picture comes <b>next</b> in the series?', stem: `<div class="figrow">${frames.map(f => box(renderFig(f))).join('')}${qbox()}</div>`, correct, wrong, explain, hint });
  }

  // analogy figure model
  const ROT = ['arrow', 'flag', 'triangle'];
  function figPrims(F) {
    const R = F.sz === 'S' ? 20 : 36;
    const out = [{ s: F.o, r: R, f: F.of, a: F.a || 0, m: F.m }];
    if (F.i) out.push({ s: F.i, r: R * 0.42, f: F.if, a: F.a || 0, m: F.m });
    return out;
  }
  const TF = {
    rot90: { ok: F => ROT.includes(F.o) && !F.i, go: F => ({ ...F, a: (F.a || 0) + 90 }), say: () => 'turns a quarter turn clockwise' },
    rot180: { ok: F => ROT.includes(F.o) && !F.i, go: F => ({ ...F, a: (F.a || 0) + 180 }), say: () => 'turns upside down (a half turn)' },
    mirror: { ok: F => F.o === 'flag', go: F => ({ ...F, m: !F.m }), say: () => 'flips over, like its mirror image' },
    fill: { ok: F => !F.i && F.of !== 'gray', go: F => ({ ...F, of: F.of === 'white' ? 'black' : 'white' }), say: F => `changes from ${F.of} to ${F.of === 'white' ? 'black' : 'white'}` },
    invert: { ok: F => !!F.i && F.of !== F.if, go: F => ({ ...F, of: F.if, if: F.of }), say: () => 'trades colors — the outside shape takes the inside color, and the inside takes the outside color' },
    swap: { ok: F => !!F.i && F.i !== F.o, go: F => ({ ...F, o: F.i, i: F.o }), say: () => 'trades shapes — the inside shape becomes the big outside shape' },
    shrink: { ok: F => F.sz !== 'S', go: F => ({ ...F, sz: 'S' }), say: () => 'shrinks to a smaller size' },
    addIn: { ok: F => !F.i && !['star', 'cross', 'arrow', 'flag'].includes(F.o), go: F => ({ ...F, i: F.o, if: F.of === 'black' ? 'white' : 'black' }), say: () => 'gets a small copy of itself drawn inside' },
  };
  const PLANS = [['rot90'], ['rot180'], ['mirror'], ['fill'], ['invert'], ['swap'], ['shrink'], ['addIn'],
    ['rot90', 'fill'], ['rot180', 'fill'], ['mirror', 'fill'], ['invert', 'swap'], ['shrink', 'fill'], ['shrink', 'invert'], ['rot90', 'shrink'], ['swap', 'shrink']];
  function applyPlan(F, plan) {
    let x = F;
    for (const p of plan) { if (!TF[p].ok(x)) return null; x = TF[p].go(x); }
    return x;
  }
  function baseFor(plan) {
    const needRot = plan.some(p => ['rot90', 'rot180', 'mirror'].includes(p));
    const needIn = plan.some(p => ['invert', 'swap'].includes(p));
    let F;
    if (needRot) F = { o: plan.includes('mirror') ? 'flag' : pick(ROT), of: pick(['white', 'black', 'gray']), a: pick([0, 90, 180, 270]), m: false, sz: 'L' };
    else if (needIn) {
      const o = pick(['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'diamond']);
      F = { o, i: pick(['circle', 'square', 'triangle', 'diamond'].filter(x => x !== o)), of: pick(['white', 'gray']), if: 'black', sz: 'L' };
      if (Math.random() < 0.5) [F.of, F.if] = [F.if, F.of];
    } else F = { o: pick(['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star', 'diamond', 'cross']), of: pick(['white', 'black']), sz: 'L' };
    return F;
  }
  function genFigAnalogy() {
    const plan = pick(PLANS);
    let A, B, C, D;
    for (let t = 0; t < 60; t++) {
      A = baseFor(plan); C = baseFor(plan);
      B = applyPlan(A, plan); D = applyPlan(C, plan);
      if (!B || !D) continue;
      const k = [A, B, C, D].map(x => figKey(figPrims(x)));
      if (new Set(k).size === 4 && (plan.includes('mirror') || A.o !== C.o)) break;
      B = null;
    }
    if (!B || !D) throw new Retry('analogy');
    const wrong = [C, B];
    if (plan.length === 2) wrong.push(applyPlan(C, [plan[0]]), applyPlan(C, [plan[1]]));
    for (const k of shuffle(Object.keys(TF))) if (!plan.includes(k)) wrong.push(applyPlan(C, [k]), applyPlan(D, [k]));
    const says = []; let x = A;
    for (const p of plan) { says.push(TF[p].say(x)); x = TF[p].go(x); }
    const stem = `<div class="figrow analogy">${box(renderFig(figPrims(A)))}<span class="arr">→</span>${box(renderFig(figPrims(B)))}<span class="sep">as</span>${box(renderFig(figPrims(C)))}<span class="arr">→</span>${qbox()}</div>`;
    const look = { rot90: 'which way it points', rot180: 'which way it points', mirror: 'whether it was turned or flipped', fill: 'the colors', invert: 'the colors', swap: 'which shape is inside', shrink: 'the size', addIn: 'what is inside' };
    return figMC({
      hint: `Compare the first two pictures. Check ${[...new Set(plan.map(p => look[p]))].join(', and ')} — and anything else that changed.`,
      prompt: 'The first two pictures go together. Which picture goes with the third one <b>in the same way</b>?',
      stem, correct: figPrims(D), wrong: wrong.filter(Boolean).map(figPrims),
      explain: `From the first picture to the second, the figure ${says.join(' <b>and</b> ')}. Do exactly the same thing to the third picture.`,
    });
  }

  function genFigClass() {
    const fam = pick(['dots', 'mirror', 'inner', 'black']);
    const oi = rnd(5);
    let items, explain;
    if (fam === 'dots') {
      const types = shuffle(['triangle', 'square', 'pentagon', 'hexagon']); types.push(pick(types));
      const sh = shuffle(types); let oddN;
      items = sh.map((s, k) => {
        let n = SIDES[s];
        if (k === oi) { n += s === 'triangle' ? 1 : pick([-1, 1]); oddN = n; }
        return [{ s, r: 38, f: 'white' }, ...dotRing(n, s === 'triangle' ? 8 : 13)];
      });
      explain = `In the other figures, the number of dots matches the number of sides (a square has 4 dots, a pentagon has 5…). The odd one is a ${sh[oi]} with ${SIDES[sh[oi]]} sides but ${oddN} dots.`;
    } else if (fam === 'mirror') {
      const angles = shuffle([0, 45, 90, 135, 180, 225, 270, 315]).slice(0, 5), f = pick(['white', 'gray', 'black']);
      items = angles.map((a, k) => [{ s: 'flag', r: 36, f, a, m: k === oi }]);
      explain = 'Four of these are the same flag, just turned to face different ways. The odd one is <b>flipped</b> — a mirror image. No amount of turning makes a mirror image match!';
    } else if (fam === 'inner') {
      const outs = shuffle(['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'diamond']).slice(0, 5); let oddIn;
      items = outs.map((o, k) => {
        let i = o;
        if (k === oi) { i = pick(['circle', 'square', 'triangle', 'diamond'].filter(x => x !== o)); oddIn = i; }
        return [{ s: o, r: 36, f: 'white' }, { s: i, r: 14, f: 'black' }];
      });
      explain = `In the other figures, the small black shape inside is the <b>same shape</b> as the big one outside. The odd one is a ${outs[oi]} with a ${oddIn} inside.`;
    } else {
      const pos = [[30, 30], [70, 30], [30, 70], [70, 70]];
      let oddN;
      items = range(0, 4).map(k => {
        const nb = k === oi ? (oddN = pick([1, 3])) : 2;
        const blacks = new Set(shuffle([0, 1, 2, 3]).slice(0, nb));
        return pos.map(([x, y], j) => ({ s: pick(['circle', 'square', 'triangle', 'diamond', 'star']), x, y, r: 14, f: blacks.has(j) ? 'black' : 'white' }));
      });
      explain = `Ignore the shapes — they are a distraction! Every other figure has exactly <b>2 black</b> pieces. The odd one has ${oddN}.`;
    }
    const hint = { dots: 'Count something inside each figure and compare it with the shape around it.', mirror: 'Imagine turning each flag. Can you make it match the others?', inner: 'Compare the small inside shape with the big outside shape.', black: 'Ignore what the shapes are — count something else.' }[fam];
    return { prompt: 'Which figure does <b>NOT</b> belong with the others?', stem: '', kind: 'fig', options: items.map(renderFig), answer: oi, explain, hint };
  }

  function cartesian(dims) { return dims.reduce((acc, d) => acc.flatMap(a => d.map(v => [...a, v])), [[]]); }
  function genMatrix() {
    const fam = pick(['latin', 'count', 'rotate', 'size']);
    const FL = shuffle(['white', 'gray', 'black']);
    const S = shuffle(['circle', 'square', 'triangle', 'pentagon', 'diamond', 'star', 'hexagon', 'cross']).slice(0, 3);
    let spec;
    if (fam === 'latin') {
      const flip = Math.random() < 0.5;
      const si = (r, c) => flip ? (r + 2 * c) % 3 : (r + c) % 3, fi = (r, c) => flip ? (r + c) % 3 : (r + 2 * c) % 3;
      spec = { dims: [S, FL], at: (r, c) => [S[si(r, c)], FL[fi(r, c)]], mk: ([s, f]) => [{ s, r: 32, f }],
        explain: `Every row and every column has one of each shape (${S.join(', ')}) and one of each shading (white, gray, black). Find which shape and which shading are missing from that row.` };
    } else if (fam === 'count') {
      const off = rnd(3);
      spec = { dims: [S, [1, 2, 3], FL], at: (r, c) => [S[r], ((r + c + off) % 3) + 1, FL[c]], mk: ([s, n, f]) => group(s, n, f, 10),
        explain: 'Each row uses one shape. Each column uses one shading. And every row has a group of 1, a group of 2 and a group of 3. Put those three rules together.' };
    } else if (fam === 'rotate') {
      const a0 = pick([0, 90, 180, 270]), cs = pick([45, 90, -45]), rs = pick([90, 180]);
      const ANG = range(0, 7).map(k => k * 45);
      const norm = a => ((a % 360) + 360) % 360;
      spec = { dims: [ANG, FL], at: (r, c) => [norm(a0 + rs * r + cs * c), FL[c]], mk: ([a, f]) => [{ s: 'arrow', r: 34, a, f }],
        explain: `Moving right, the arrow turns ${Math.abs(cs)}° ${cs > 0 ? 'clockwise' : 'counter-clockwise'} each box, and each column has its own shading. Each new row starts ${rs === 180 ? 'pointing the opposite way' : 'a quarter turn further clockwise'}.` };
    } else {
      const SZ = [14, 24, 36];
      spec = { dims: [S, SZ, FL], at: (r, c) => [S[c], SZ[r], FL[(r + c) % 3]], mk: ([s, z, f]) => [{ s, r: z, f }],
        explain: 'Each column keeps the same shape, each row keeps the same size (small, medium, large), and the shading shifts over by one in each row.' };
    }
    const hint = { latin: 'Look at the row with the empty box. Which shape and which shading have not been used yet?', count: 'Check three things: the shape, how many there are, and the shading. Each one follows a rule by row or by column.', rotate: 'Follow the arrow along a row. Which way does it turn each step? Then check the shading in each column.', size: 'Look down a column for the shape, across a row for the size, and then check the shading.' }[fam];
    const [mr, mcol] = Math.random() < 0.7 ? [2, 2] : [rnd(3), rnd(3)];
    const corr = spec.at(mr, mcol);
    const hd = v => v.reduce((n, x, i) => n + (x !== corr[i] ? 1 : 0), 0);
    const all = cartesian(spec.dims).filter(v => hd(v) > 0);
    const wrong = [...shuffle(all.filter(v => hd(v) === 1)), ...shuffle(all.filter(v => hd(v) > 1))].map(spec.mk);
    let cells = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells += (r === mr && c === mcol) ? qbox() : box(renderFig(spec.mk(spec.at(r, c))));
    return figMC({ prompt: 'Which picture belongs in the empty box?', stem: `<div class="matrix">${cells}</div>`, correct: spec.mk(corr), wrong, explain: spec.explain, hint });
  }

  // ───────── QUANTITATIVE ─────────
  function numWrong(ans, extra) {
    const out = [...extra];
    for (const d of shuffle([1, -1, 2, -2, 3, -3, 4, 5, -5, 10, -10])) out.push(ans + d);
    return out;
  }
  function genNumSeries() {
    const fam = pick(['add', 'mult', 'alt', 'grow', 'square', 'interleave', 'muladd', 'fib']);
    let seq, explain;
    if (fam === 'add') {
      const d = pick([1, -1]) * rint(3, 14), a = d > 0 ? rint(1, 40) : rint(-d * 6 + 2, 120);
      seq = range(0, 5).map(i => a + d * i);
      explain = `Each number is ${Math.abs(d)} ${d > 0 ? 'more' : 'less'} than the one before.`;
    } else if (fam === 'mult') {
      const k = pick([2, 3]), a = k === 2 ? rint(2, 7) : rint(1, 4);
      seq = range(0, 5).map(i => a * k ** i);
      explain = `Each number is multiplied by ${k}.`;
    } else if (fam === 'alt') {
      const p = rint(4, 12), q = rint(1, p - 1), sg = Math.random() < 0.6 ? -1 : 1;
      let a = rint(5, 30); seq = [a];
      for (let i = 1; i < 7; i++) { a += i % 2 ? p : sg * q; seq.push(a); }
      explain = `The jumps alternate: +${p}, ${sg < 0 ? '−' : '+'}${q}, +${p}, ${sg < 0 ? '−' : '+'}${q}…`;
    } else if (fam === 'grow') {
      const d0 = rint(1, 5), k = rint(1, 3); let a = rint(1, 20); seq = [a];
      for (let i = 0; i < 5; i++) { a += d0 + k * i; seq.push(a); }
      explain = `The jumps get bigger by ${k} each time: +${d0}, +${d0 + k}, +${d0 + 2 * k}, +${d0 + 3 * k}…`;
    } else if (fam === 'square') {
      const off = pick([0, 0, 1, -1, 2]), s0 = rint(1, 5);
      seq = range(0, 5).map(i => (s0 + i) ** 2 + off);
      explain = `These are square numbers${off ? ` ${off > 0 ? 'plus' : 'minus'} ${Math.abs(off)}` : ''}: ${range(0, 2).map(i => `${s0 + i}×${s0 + i}${off ? (off > 0 ? '+' : '−') + Math.abs(off) : ''}`).join(', ')}…`;
    } else if (fam === 'interleave') {
      const a = rint(1, 15), d1 = rint(2, 6), b = rint(30, 60), d2 = pick([1, -1]) * rint(2, 5);
      seq = range(0, 7).map(i => i % 2 === 0 ? a + d1 * (i / 2) : b + d2 * ((i - 1) / 2));
      explain = `Two patterns are mixed together! The 1st, 3rd, 5th… numbers go up by ${d1}. The 2nd, 4th, 6th… numbers go ${d2 > 0 ? 'up' : 'down'} by ${Math.abs(d2)}.`;
    } else if (fam === 'muladd') {
      const c = pick([1, -1, 2, 3]); let a = c < 0 ? rint(3, 6) : rint(1, 5); seq = [a];
      for (let i = 0; i < 5; i++) { a = a * 2 + c; seq.push(a); }
      explain = `Each number is doubled, then ${c > 0 ? c + ' is added' : Math.abs(c) + ' is subtracted'}.`;
    } else {
      const a = rint(1, 6), b = rint(a, a + 6); seq = [a, b];
      while (seq.length < 7) seq.push(seq.at(-1) + seq.at(-2));
      explain = 'Each number is the sum of the two numbers before it.';
    }
    const hint = { add: 'Write down the jump between each pair of numbers.', mult: 'These numbers grow fast. Try multiplying instead of adding.', alt: 'Write down the jumps. Do they repeat in a pattern?', grow: 'Write down the jumps. Then look at how the jumps themselves change.', square: 'Do these numbers look familiar? Think 1×1, 2×2, 3×3…', interleave: 'Try looking at every OTHER number.', muladd: 'Try doubling each number. How far off is the next one?', fib: 'Compare each number with the two numbers right before it.' }[fam];
    const ans = seq.pop(), last = seq.at(-1), diff = last - seq.at(-2);
    const stem = `<div class="numrow">${seq.map(n => `<span>${n}</span>`).join('')}<span class="q">?</span></div>`;
    return mc({ prompt: 'Which number comes next?', stem, correct: ans, wrong: numWrong(ans, [last + diff, last + 2 * diff - (ans - last)]).filter(x => x !== ans), explain: `${explain} So the next number is <b>${ans}</b>.`, hint, count: 5 });
  }

  // Alternative simple rules, used to reject puzzles that more than one rule could explain.
  const ALT1 = [];
  for (let a = 1; a <= 6; a++) for (let b = -12; b <= 15; b++) ALT1.push(x => a * x + b);
  for (let b = -5; b <= 6; b++) ALT1.push(x => x * x + b);
  const ALT2 = [(a, b) => a + b, (a, b) => a * b, (a, b) => 2 * a + b, (a, b) => a + 2 * b, (a, b) => 3 * a + b, (a, b) => a + 3 * b,
    (a, b) => a * a + b, (a, b) => a + b * b, (a, b) => a * b - a, (a, b) => a * b - b, (a, b) => a - b, (a, b) => b - a, (a, b) => 2 * (a + b)];
  for (let k = -6; k <= 10; k++) if (k) ALT2.push((a, b) => a + b + k, (a, b) => a * b + k, (a, b) => 2 * a + b + k);

  function genNumInfer() {
    if (Math.random() < 0.4) return genNumInfer2();
    const rules = [
      () => { const a = rint(2, 5), b = rint(-4, 9); return { f: x => a * x + b, say: `multiply by ${a}${b > 0 ? `, then add ${b}` : b < 0 ? `, then subtract ${-b}` : ''}` }; },
      () => { const b = pick([0, 1, -1, 2, 3]); return { f: x => x * x + b, say: `multiply the number by itself${b > 0 ? `, then add ${b}` : b < 0 ? `, then subtract ${-b}` : ''}` }; },
      () => { const a = rint(2, 4), b = rint(1, 6); return { f: x => (x + b) * a, say: `add ${b}, then multiply by ${a}` }; },
      () => { const b = rint(2, 9); return { f: x => 2 * x - b, say: `double it, then subtract ${b}` }; },
    ];
    const R = pick(rules)();
    let xs;
    do { xs = shuffle(range(2, 12)).slice(0, 4); } while (xs.some(x => R.f(x) <= 0));
    const [x1, x2, x3, xq] = xs, ys = [x1, x2, x3].map(R.f), ans = R.f(xq);
    if (ALT1.some(g => [x1, x2, x3].every((x, i) => g(x) === ys[i]) && g(xq) !== ans)) throw new Retry('ambiguous');
    const wrong = [xq + (ys[0] - x1), R.f(xq + 1), R.f(xq - 1)];
    if (ys[0] % x1 === 0) wrong.push(xq * ys[0] / x1);
    const stem = `<div class="pairs">${[x1, x2, x3].map((x, i) => `<span>${x} <i>→</i> ${ys[i]}</span>`).join('')}<span class="q">${xq} <i>→</i> ?</span></div>`;
    return mc({ prompt: 'Each number on the left is changed by the <b>same rule</b>. What does the last number become?', stem, correct: ans, wrong: numWrong(ans, wrong).filter(x => x !== ans && x > 0), count: 5,
      hint: 'Compare each answer with its starting number. Guess a rule — then test it on EVERY pair, not just the first one.',
      explain: `The rule is: <b>${R.say}</b>. Check it on every pair: ${[x1, x2, x3].map((x, i) => `${x} → ${ys[i]}`).join(', ')}. So ${xq} → <b>${ans}</b>.` });
  }

  function genNumInfer2() {
    const RULES = [
      { f: (a, b) => a * b, say: 'multiply the two numbers' },
      ...[1, 2, 3, -1, -2].map(c => ({ f: (a, b) => a * b + c, say: `multiply the two numbers, then ${c > 0 ? 'add ' + c : 'subtract ' + -c}` })),
      { f: (a, b) => 2 * a + b, say: 'double the first number, then add the second' },
      { f: (a, b) => a + 2 * b, say: 'add the first number to double the second' },
      { f: (a, b) => 2 * (a + b), say: 'add the two numbers, then double the total' },
      ...[2, 3, 5].map(c => ({ f: (a, b) => a + b + c, say: `add the two numbers, then add ${c} more` })),
    ];
    const R = pick(RULES);
    const ps = [];
    while (ps.length < 4) { const p = [rint(2, 9), rint(2, 9)]; if (p[0] !== p[1] && !ps.some(q => q[0] === p[0] && q[1] === p[1])) ps.push(p); }
    const ys = ps.map(([a, b]) => R.f(a, b)), ans = ys[3];
    const fits = g => ps.slice(0, 3).every(([a, b], i) => g(a, b) === ys[i]);
    if (ALT2.some(g => fits(g) && g(...ps[3]) !== ans)) throw new Retry('ambiguous');
    const tempting = ALT2.filter(g => g(...ps[0]) === ys[0]).map(g => g(...ps[3])); // rules that fit only the first example
    const pr = ([a, b]) => `(${a}, ${b})`;
    const stem = `<div class="pairs">${ps.slice(0, 3).map((p, i) => `<span>${pr(p)} <i>→</i> ${ys[i]}</span>`).join('')}<span class="q">${pr(ps[3])} <i>→</i> ?</span></div>`;
    return mc({ prompt: 'Each pair of numbers is turned into one number by the <b>same rule</b>. What does the last pair become?', stem, correct: ans,
      wrong: numWrong(ans, shuffle(tempting)).filter(x => x !== ans && x > 0), count: 5,
      hint: 'Try combining the two numbers — add them, multiply them, double one of them — then see if something extra was added. Check your rule on every pair!',
      explain: `The rule is: <b>${R.say}</b>. Check: ${ps.slice(0, 3).map((p, i) => `${pr(p)} → ${ys[i]}`).join(', ')}. So ${pr(ps[3])} → <b>${ans}</b>.` });
  }

  function genNumMatrix() {
    const fam = pick(['sum', 'prod', 'scale', 'magic', 'step', 'combo', 'combo']);
    let g, explain, rowRule = null;
    if (fam === 'sum') { rowRule = (a, b) => a + b; g = range(0, 2).map(() => { const a = rint(2, 20), b = rint(2, 20); return [a, b, a + b]; }); explain = 'In each row, the first number plus the second number equals the third.'; }
    else if (fam === 'prod') { rowRule = (a, b) => a * b; g = range(0, 2).map(() => { const a = rint(2, 9), b = rint(2, 9); return [a, b, a * b]; }); explain = 'In each row, the first number times the second number equals the third.'; }
    else if (fam === 'combo') {
      const C = pick([
        { f: (a, b) => 2 * a + b, say: 'double the first number, then add the second' },
        { f: (a, b) => 2 * a + b + 1, say: 'double the first number, add the second, then add 1' },
        { f: (a, b) => a * b + 1, say: 'multiply the first two numbers, then add 1' },
        { f: (a, b) => a * b - b, say: 'multiply the first two numbers, then subtract the second number' },
      ]);
      rowRule = C.f;
      g = range(0, 2).map(() => { const a = rint(2, 9), b = rint(2, 9); return [a, b, C.f(a, b)]; });
      explain = `In each row: <b>${C.say}</b> to get the third number.`;
    }
    else if (fam === 'scale') { const k = pick([2, 3]); g = range(0, 2).map(() => { const a = rint(1, 9); return [a, a * k, a * k * k]; }); explain = `Moving right in each row, the number is multiplied by ${k}.`; }
    else if (fam === 'magic') { const T = rint(15, 40); g = range(0, 2).map(() => { const a = rint(1, T - 10), b = rint(1, T - a - 1); return [a, b, T - a - b]; }); explain = `Every row adds up to the same total: ${T}.`; }
    else { g = range(0, 2).map(() => { const a = rint(1, 20), d = rint(2, 9); return [a, a + d, a + 2 * d]; }); explain = 'Each row goes up by the same jump each time (each row has its own jump).'; }
    if (new Set(g.map(r => r.join())).size < 3) throw new Retry('dup rows');
    const [mr, mcol] = (fam === 'magic' || fam === 'sum') ? [rnd(3), rnd(3)] : [rnd(3), 2];
    const ans = g[mr][mcol];
    if (rowRule) {
      // reject if another simple rule fits the two full rows but fills the gap differently
      const full = g.filter((_, r) => r !== mr);
      for (const alt of ALT2) {
        if (!full.every(([a, b, c]) => alt(a, b) === c)) continue;
        for (let v = 0; v <= 120; v++) {
          if (v === ans) continue;
          const row = g[mr].slice(); row[mcol] = v;
          if (alt(row[0], row[1]) === row[2]) throw new Retry('ambiguous grid');
        }
      }
    }
    const alt = fam === 'sum' ? g[mr][0] * g[mr][1] : fam === 'prod' ? g[mr][0] + g[mr][1] : fam === 'combo' ? g[mr][0] + g[mr][1] : ans + (g[mr][1] - g[mr][0]);
    let cells = '';
    g.forEach((row, r) => row.forEach((v, c) => { cells += r === mr && c === mcol ? '<span class="q">?</span>' : `<span>${v}</span>`; }));
    return mc({ prompt: 'Which number belongs where the question mark is?', stem: `<div class="nummatrix">${cells}</div>`, correct: ans, wrong: numWrong(ans, [alt]).filter(x => x !== ans && x >= 0), count: 5,
      hint: fam === 'magic' ? 'Add up each full row. What do you notice?' : 'Use the two full rows to discover the rule. Try adding, multiplying, or doubling — then use it on the row with the question mark.',
      explain: `${explain} So the missing number is <b>${ans}</b>.` });
  }

  // ───────── TYPES & CATEGORIES ─────────
  const TYPES = {
    antonym: { name: 'Opposites', icon: '↔️', gen: genAntonym,
      intro: 'You get one word and have to find the word that means the reverse. The test makers love to sneak in a <b>synonym</b> (a word that means the SAME thing) as a trap.',
      trick: 'Make up a quick sentence with the word, then swap in each answer. If the sentence flips meaning, that’s your answer. If it means the same thing — that’s a trap, skip it!' },
    completion: { name: 'Sentence Completion', icon: '✏️', gen: genCompletion,
      intro: 'A sentence has a blank. Your job is to find the word that fits the <b>meaning</b>, not just the grammar.',
      trick: 'Hunt for clue words. <b>because, so, and</b> keep the meaning going the same way. <b>although, but, despite, unlike, rather than</b> flip it the other way. Fill the blank with your own word first, then find the closest match.' },
    arrange: { name: 'Sentence Arrangement', icon: '🔀', gen: genArrange,
      intro: 'Words or sentences are scrambled. Sometimes you rebuild a sentence and say which word lands in a certain spot; sometimes you put sentences in order to make the best story.',
      trick: 'Find the <b>who</b> (subject) and the <b>action</b> (verb) first — they usually start the sentence. Then build the rest and count spots on your fingers. Say it in your head to make sure it sounds natural.' },
    analogy: { name: 'Word Analogies', icon: '🔗', gen: genAnalogy,
      intro: 'Analogies look like “bird is to nest as bee is to ___.” The first pair has a relationship, and you have to find a second pair with the <b>exact same</b> relationship.',
      trick: 'Make a bridge sentence for the first pair: “A bird <i>lives in</i> a nest.” Then use the same sentence for the second pair: “A bee <i>lives in</i> a ___.” If two answers fit, make your bridge sentence more specific.' },
    classify: { name: 'Odd Word Out', icon: '🧺', gen: genClassify,
      intro: 'Four words belong to the same group. One doesn’t. Find the one that doesn’t belong.',
      trick: 'Name the group as <b>specifically</b> as you can. Not just “animals,” but “mammals”; not just “instruments,” but “string instruments.” Sometimes the group is about grammar or spelling, not meaning!' },
    logical: { name: 'Always Has', icon: '✅', gen: genLogical,
      intro: 'These ask what something <b>always</b> has — not what it usually has. “Always” is a very strong word.',
      trick: 'For each answer, try to imagine one example WITHOUT it. A garden without flowers? Sure — a vegetable garden. A garden without plants? Impossible. The answer you can’t imagine away is the winner.' },
    logic: { name: 'Logic Statements', icon: '🧠', gen: genLogic,
      intro: 'You read a few facts and decide what <b>must</b> be true. Only use the facts on the page — not what’s usually true in real life.',
      trick: 'Draw circles! “All snakes are reptiles” means the snake circle fits inside the reptile circle. Then check each answer. “Must be true” means no exceptions, ever. If it only <i>might</i> be true, it’s wrong.' },
    order: { name: 'Who’s First?', icon: '🏁', gen: genOrder,
      intro: 'You get clues comparing people — taller, older, faster — and have to put them in order.',
      trick: 'Draw a ladder. Put the first two names on it, then add each new person above or below. Careful: “Ben is <i>shorter</i> than Ava” means Ava goes <b>above</b> Ben. Flip those clues before you place them.' },
    letters: { name: 'Letter Patterns', icon: '🔤', gen: genLetters,
      intro: 'Letters follow a hidden pattern — in a row, or in a grid with rows and columns. Figure out the pattern and find what’s missing.',
      trick: 'Turn letters into numbers: A=1, B=2, C=3… Then write the jumps between them, just like a number series. Tip: E=5, J=10, O=15, T=20 help you count fast.' },
    arith: { name: 'Word Problems', icon: '🧮', gen: genArith,
      intro: 'Short story problems that test whether you can figure out <b>what to do</b>, not just how to do it.',
      trick: 'Read the very last sentence first so you know what they’re asking. Watch for traps: changing units (weeks → days), fractions “of what’s left,” and choosing the discount instead of the price. Estimate before you calculate.' },
    figSeries: { name: 'Picture Series', icon: '➡️', gen: genFigSeries,
      intro: 'A row of pictures changes step by step. You pick the picture that comes next.',
      trick: 'Watch <b>one thing at a time</b>. Is something turning? Moving around? Getting more or fewer? Changing color? Track each change separately, then find the answer with ALL the changes.' },
    figAnalogy: { name: 'Picture Analogies', icon: '🔁', gen: genFigAnalogy,
      intro: 'Just like word analogies, but with pictures: the first picture changes into the second, and you have to change the third picture the same way.',
      trick: 'Say the change out loud in words: “It turns a quarter turn clockwise AND turns black.” Then do exactly that to the third picture. Wrong answers often do only <i>half</i> the change, or copy the example.' },
    figClass: { name: 'Odd Picture Out', icon: '🔍', gen: genFigClass,
      intro: 'Four pictures share a secret rule. One breaks it. Find the rule-breaker.',
      trick: 'Make a checklist: number of sides, number of dots, colors, inside shapes, which way it points, and — sneaky — mirror flips. Some details are just there to distract you.' },
    matrix: { name: 'Pattern Grids', icon: '🔳', gen: genMatrix,
      intro: 'A 3×3 grid of pictures has one empty box. The rows and columns follow patterns, and you pick what fills the gap.',
      trick: 'Check rows AND columns. A favorite trick: every row has one of each shape and one of each color — so look at what’s already used in that row and pick what’s missing.' },
    numSeries: { name: 'Number Series', icon: '🔢', gen: genNumSeries,
      intro: 'A list of numbers follows a rule. Find the rule and the next number.',
      trick: 'Write the <b>jump</b> between each pair of numbers. Jumps the same? Easy. Jumps growing? Find the jumps between the jumps. Numbers growing fast? Try × instead of +. Still stuck? Look at every <i>other</i> number.' },
    numInfer: { name: 'Number Machines', icon: '⚙️', gen: genNumInfer,
      intro: 'Numbers (or pairs of numbers) go into a machine and come out changed. Figure out what the machine does.',
      trick: 'Guess a rule from the first pair, then <b>test it on every pair</b>. “Add 8” might work for the first pair but fail on the second. Two-step rules like “× 3 then + 2” are common.' },
    numMatrix: { name: 'Number Grids', icon: '#️⃣', gen: genNumMatrix,
      intro: 'A grid of numbers where each row follows the same rule. One number is missing.',
      trick: 'Use the two complete rows to discover the rule. Try: does the third number equal first + second? first × second? Does each row add up to the same total? Then apply it to the row with the gap.' },
  };
  const CATS = [
    { id: 'verbal', name: 'Word Power', sub: 'Verbal Comprehension', color: '#4f86b8', types: ['antonym', 'completion', 'arrange'] },
    { id: 'reason', name: 'Word Logic', sub: 'Verbal Reasoning', color: '#9a6fb0', types: ['analogy', 'classify', 'logical', 'logic', 'order', 'letters', 'arith'] },
    { id: 'figural', name: 'Picture Puzzles', sub: 'Figural Reasoning', color: '#e39a3b', types: ['figSeries', 'figAnalogy', 'figClass', 'matrix'] },
    { id: 'quant', name: 'Number Sense', sub: 'Quantitative Reasoning', color: '#6a9a3a', types: ['numSeries', 'numInfer', 'numMatrix'] },
  ];
  CATS.forEach(c => c.types.forEach(t => { TYPES[t].cat = c.id; }));

  function generate(type) {
    for (let i = 0; i < 40; i++) {
      try { const q = TYPES[type].gen(); q.type = type; return q; } catch (e) { if (!(e instanceof Retry)) throw e; }
    }
    throw new Error('could not generate ' + type);
  }

  G.OreoContent = { TYPES, CATS, generate, shuffle, renderFig, _banks: { ANTONYMS, COMPLETIONS, ARRANGE, ANALOGIES, CLASSIFY, LOGICAL, LOGIC } };
})(typeof window !== 'undefined' ? window : globalThis);
