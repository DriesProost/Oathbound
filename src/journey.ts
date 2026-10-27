import { Castle, DoorOpen, Wind, Trees, Church, Mountain, Anchor, Landmark } from "lucide-react";
// Presentation metadata, separate from walking rewards and persisted distance.
const originalLandmarks = [
  {
    id: "keep",
    sceneAlt: "A modest stone holdfast at dawn, with a smoking chimney and muddy working yard.",
    name: "Your Keep",
    km: 0,
    x: 70,
    y: 260,
    icon: Castle,
    inscription: "The gate stands behind you. The road lies ahead.",
    title: "The road that remembers",
    teaser: "A mill wheel turns beyond the lower fields. Nobody has sent grain there for years.",
    story: [
      "Before you leave, the keeper lays a folded map beside your breakfast. It is mostly ordinary things: a bridge that floods, an inn with a sound roof, a village beyond the oaks. Along one edge, in a different hand, someone has written: Ask at the mill. The keeper notices you reading it. ‘That road used to bring half our provisions,’ she says. ‘Now everyone takes the long way round.’",
      "You expect a charge to investigate bandits, perhaps, or recover some stolen heirloom. Instead she gives you a small brass key, tied to a faded green ribbon. ‘The miller’s daughter left this here last winter. Said she would come back when the road was fit to travel. We have heard nothing since.’ There is no crest on the key, no jewel, no promise of glory. Its teeth are worn smooth from years of opening the same door.",
      "Outside, the yard smells of rain and split oak. A groom is repairing a stirrup; two kitchen hands are arguing over a sack of onions. The world has not paused to watch your departure. You tuck the key safely away and pass beneath the gate. For now, your task is simple: follow the road, ask a question, and see what people have been carrying in your absence.",
    ],
  },
  {
    id: "mill",
    sceneAlt: "A mossy watermill beside an alder-lined river, with a wooden wheel and crows in the trees.",
    name: "Old Mill",
    km: 9,
    x: 195,
    y: 165,
    icon: Wind,
    inscription: "The wheel turns at dusk, though no grain waits beneath the stones.",
    title: "The miller’s mark",
    teaser: "Smoke rises farther along the road. At the inn, someone may remember the green ribbon.",
    story: [
      "The Old Mill stands where the stream narrows between two banks of alder. Its roof has lost a few tiles, but the wheel turns with a patient wooden knock. You find the miller on a ladder, pressing a patch into a gutter. When you call up, he studies the ribbon in your hand before climbing down. ‘My daughter’s,’ he says. Then, after a moment: ‘She is alive. If that is what you came to ask.’",
      "Her name is Mara. She went to Oakhaven to mend the village granary after a wet harvest and stayed when the northern bridge washed out. The miller has had letters, but no visit. He has kept the wheel running so its bearings will not seize. The empty sacks inside are neatly folded. On the doorpost, shallow cuts mark the heights of children who have long since grown taller than their father.",
      "He shows you the mark on the brass key: a little sheaf of barley, almost rubbed away. It opens the storehouse behind the mill. Mara kept her tools there before she left. ‘Tell her the place is dry,’ he says. ‘Tell her I fixed the gutter. She will ask.’ You offer to carry a longer message, but he shakes his head, then changes his mind and brings out a packet wrapped in linen. Inside is her mother’s measuring cord. ‘The innkeeper can point you onward. Mind the stone steps by the stream. They are worse than they look.’",
    ],
  },
  {
    id: "inn",
    sceneAlt: "Warm inn windows beside a wet road at dusk, with horses waiting outside.",
    name: "Wayfarer’s Inn",
    km: 21,
    x: 425,
    y: 230,
    icon: DoorOpen,
    inscription: "At the inn, a place by the hearth and an unfinished letter await.",
    title: "A place at the table",
    teaser: "Beyond the oaks lies a village repairing more than its gates.",
    story: [
      "The Wayfarer’s Inn has a low lintel and a door polished by generations of shoulders. Inside, damp cloaks steam beside the hearth. The innkeeper sets down a bowl without asking for your story first. When you mention Mara, she points to the far end of the table. There is a chair with a mended back and, beneath a slate used for reckoning accounts, a letter addressed to the miller.",
      "‘She meant to bring it herself,’ the innkeeper says. ‘Then the granary roof needed bracing. Then someone’s cart axle broke. You know how useful people get detained.’ The letter is sealed, and you leave it so. A carter nearby explains that Oakhaven has been rebuilding the northern approach stone by stone. There are no marauding armies in his account, only a river, a poor harvest, and too few hands when work must be done before winter.",
      "The innkeeper recognises the measuring cord. She remembers Mara stretching it across this very room to prove that the new table would fit. It did, though the carter claims the old one had better proportions. The dispute has evidently lasted years. Before you leave, she wraps bread for the road and asks you to bring the letter back this way if Mara cannot travel. Through the window, the evening light catches a line of oaks. For the first time, Oakhaven feels less like a name on a map and more like a room full of people you have almost met.",
    ],
  },
  {
    id: "oakhaven",
    sceneAlt: "An open town gate, timbered houses and lanterns beneath a distant church tower.",
    name: "Oakhaven",
    km: 30,
    x: 560,
    y: 100,
    icon: Castle,
    inscription: "The lamps of Oakhaven appear through the evening mist.",
    title: "What holds a village together",
    teaser: "For now, the road has brought you where you were needed.",
    story: [
      "Oakhaven’s gate is open when you arrive. A fresh timber leans against the old stonework, waiting to be fitted, and someone has chalked measurements across its face. You find Mara at the granary, holding one end of a board while a boy checks the other against a wall. She looks first at the ribbon, then at the linen packet. For a moment she says nothing. ‘Did he fix the gutter?’ she asks at last.",
      "You give her the miller’s exact words. She laughs, quietly, and rolls the measuring cord between her fingers. The work here has grown around her: a roof repaired became a storehouse made dry, which became a bridge fit for carts. She had thought leaving before it was finished would mean abandoning everyone. Looking at the key, she admits that staying without sending word has left someone else waiting. Neither duty was imaginary. Neither was easy to put down.",
      "She writes a reply at a bench by the granary door. You carry the inn’s sealed letter to her and, later, hers back toward the hearth where it will be collected. Before you go, she walks with you to the northern approach. The last stones are not yet laid, but the river is crossing underneath instead of over it. There will be more journeys, and work that takes longer than anyone expects. Tonight, one small thing has reached its proper hands. Behind you, the village lamps are being lit, one window at a time.",
    ],
  },
];

export const landmarks = [...originalLandmarks,
  {id:'watchtower',name:'Northwatch Tower',km:45,icon:Castle,x:0,y:0,sceneAlt:'Northwatch Tower',inscription:'The tower keeps a lamp for travellers, not a toll for their purses.',title:'A lamp in the window',teaser:'Beyond the tower, an old bridge joins the two banks again.',story:['At Oakhaven, Mara points out the northern watchtower on your map. Its windows are lit, although the watch was disbanded years ago. Someone has kept a shelter there for people who cannot afford the inn. A former watchman asks you to help settle who may use it. The people of this road have a question worth following.'],art:'watchtower'},
  {id:'stonebridge',name:'Stonebridge',km:65,icon:Landmark,x:0,y:0,sceneAlt:'Stonebridge',inscription:'A bridge is an agreement between people who live on different banks.',title:'The crossing book',teaser:'The abbey upstream keeps copies of the old crossing accounts.',story:['At Stonebridge, a mason is fitting the last coping stone. The bridge is sound; its accounts are less certain. Two villages have each paid for the same grain delivery. The mason directs you to the abbey copyist, who never throws away a receipt. Before you leave, he asks you to carry a clean copy of the new toll notice.'],art:'fields'},
  {id:'alder-abbey',name:'Alder Abbey',km:90,icon:Church,x:0,y:0,sceneAlt:'Alder Abbey',inscription:'In the sheltered court, even a difficult question may be asked quietly.',title:'A dry place for papers',teaser:'Across the reed beds, a market village is waiting for the accounts.',story:['Alder Abbey stands above the river, its kitchen garden sheltered by a low wall. Brother Aldren lays out two accounts beside a loaf of bread. The sums agree once an obsolete toll is removed. He offers to keep a copy where both villages can read it. There is room on his bench, and he asks whether the Keep might have room for his books.'],art:'monastery'},
  {id:'reedmere',name:'Reedmere',km:120,icon:DoorOpen,x:0,y:0,sceneAlt:'Reedmere',inscription:'The market bell calls neighbours together before it calls traders.',title:'The bell at noon',teaser:'A charcoal track climbs from the marsh to the forest lodge.',story:['Reedmere is built on small rises above the reed beds. At noon the market bell rings twice, though the market is closed. The bell keeper explains that it summons people to check the raised footpath after rain. Mistress Elin is there with clean bandages and a kettle. She gives you a message for the forest lodge: the next delivery needs dry shelter, not a faster horse.'],art:'village'},
  {id:'greenwood',name:'Greenwood Lodge',km:160,icon:Trees,x:0,y:0,sceneAlt:'Greenwood Lodge',inscription:'A sheltered clearing, a repaired roof, and room to hear the wind.',title:'The forest ledger',teaser:'Above the trees, the pass keeper has a different sort of map.',story:['At Greenwood Lodge, charcoal burners share a table with the forest warden. Their boundary marks have become difficult to read, and neither side wants an argument that outlives the trees. A map at the lodge records where each family may gather fallen wood. You carry a copy towards the pass, where an older survey is said to survive.'],art:'forest'},
  {id:'highpass',name:'Highpass',km:210,icon:Mountain,x:0,y:0,sceneAlt:'Highpass',inscription:'The cairns mark the safe path; nobody is asked to hurry.',title:'A map with margins',teaser:'The road descends towards a harbour where inland letters meet the tide.',story:['Highpass has a stone shelter and a keeper who can identify approaching weather by what disappears first. Her survey places the forest boundary beside an old spring. The missing mark was buried by a small fall of stones. She sends word down to the lodge, then points you towards the coast. A harbour clerk has been asking about the inland road.'],art:'fields'},
  {id:'salt-harbour',name:'Salt Harbour',km:270,icon:Anchor,x:0,y:0,sceneAlt:'Salt Harbour',inscription:'Ropes creak against the quay; every arrival brings another account.',title:'Letters by water',teaser:'The old coast road leads inland through a town of patient craftspeople.',story:['Salt Harbour smells of tar, wet rope and bread from the quay oven. A clerk sorts inland letters from those bound for the islands. One packet has crossed the sea three times because nobody recognised its village name. Your map supplies the modern name. The packet can finally go home, with a cooper travelling towards Dunmere.'],art:'village'},
  {id:'dunmere',name:'Dunmere',km:340,icon:DoorOpen,x:0,y:0,sceneAlt:'Dunmere',inscription:'A town held together by good joints and better neighbours.',title:'The guildhall table',teaser:'Beyond the workshops, a small beacon watches the open moor.',story:['Dunmere’s guildhall has a table broad enough for a map and the people who disagree about it. The cooper delivers the wandering packet to a retired shipwright. It contains drawings from his daughter, who now builds boats across the water. He lends you a lantern for the moor road and asks that it be passed to the keeper at Moorwatch.'],art:'inn'},
  {id:'moorwatch',name:'Moorwatch',km:420,icon:Castle,x:0,y:0,sceneAlt:'Moorwatch',inscription:'A low light carries farther than a grand promise in the mist.',title:'The lantern chain',teaser:'The next valley grows apples, and keeps a rather crowded noticeboard.',story:['Moorwatch is a low tower beside a wide expanse of heather. Its keeper accepts the lantern and hangs it behind a polished plate. The old light was too high to see in low cloud. She asks travellers where they first noticed it, keeping their answers in a little book. On your map, she marks the sheltered descent into Orchard Vale.'],art:'watchtower'},
  {id:'orchard-vale',name:'Orchard Vale',km:510,icon:Trees,x:0,y:0,sceneAlt:'Orchard Vale',inscription:'The orchard gate is open, and nobody agrees on the best variety.',title:'A harvest shared',teaser:'A meeting of roads lies beyond the valley, with messages from every direction.',story:['Orchard Vale has a communal press and three incompatible opinions about cider. The harvest is good; the difficulty is getting crates to households without carts. A noticeboard matches spare space with nearby deliveries. You carry a handful of route slips to Northcross, where the weekly carriers gather. Useful journeys tend to leave room for someone else’s parcel.'],art:'fields'},
  {id:'northcross',name:'Northcross',km:620,icon:Landmark,x:0,y:0,sceneAlt:'Northcross',inscription:'Four roads meet; the signpost has room for more than one destination.',title:'The carriers’ bench',teaser:'Farther north, a hill town keeps the first lamp of the evening.',story:['Northcross is less a village than a useful meeting. Carriers trade weather reports beneath a roof built from mismatched beams. The orchard slips find willing hands. A young messenger shows you a letter for Lantern Hill and asks which northern path avoids the flooded ford. The keeper’s notes from Moorwatch settle the question. Your earlier journey has become someone else’s good map.'],art:'inn'},
  {id:'lantern-hill',name:'Lantern Hill',km:750,icon:Castle,x:0,y:0,sceneAlt:'Lantern Hill',inscription:'From the hill, the lights behind you make a road you can recognise.',title:'A road of answering lights',teaser:'This stretch is complete. Every reached place and story remains yours to revisit.',story:['Lantern Hill looks back over the valleys you have crossed. At dusk the town lights its hall before its watchtower, so the first light means welcome. The messenger’s letter reaches a schoolteacher who reads it twice and puts the kettle on. From the hill you can trace the road by its answering lights. It is a long way from the Keep, but the places between are no longer strangers.'],art:'village'},
];

export function routePosition(distance: number) {
  const safe = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const index = Math.max(0, landmarks.findLastIndex(stop => safe >= stop.km));
  const current = landmarks[index], next = landmarks[index + 1];
  const region = Math.min(Math.floor(index / 3), Math.ceil((landmarks.length - 1) / 3) - 1);
  return {index,current,next,region,stops:landmarks.slice(region * 3, region * 3 + 4),
    remaining:next ? Math.max(0,next.km-safe) : 0,
    progress:next ? Math.min(1,(safe-current.km)/(next.km-current.km)) : 1};
}
// Household introductions belong to reached places, never attribute/age counters.
// Permanent arrival records remain authoritative for existing residents.
export const journeyResidents = {bard:'mill',scout:'inn',herald:'oakhaven',arms:'watchtower',captain:'stonebridge',scholar:'alder-abbey',physician:'reedmere'} as const;
export const residentStop = (id:string) => landmarks.find(stop => stop.id === journeyResidents[id as keyof typeof journeyResidents]);

// Story quests are picked up on the route. The seven beats include a choice,
// confrontation and ending; distance opens each beat, reading never skips it.
const questPaths = [
 [30,34,38,41,45,49,52], [65,70,76,82,90,95,100],
 [120,130,140,150,160,170,180], [210,225,240,255,270,285,300],
 [340,360,380,400,420,440,460], [510,535,560,590,620,650,680],
];
export function storyRouteKm(arcIndex:number,stage:number) {
 const path=questPaths[arcIndex];
 return path ? path[Math.max(0,Math.min(6,stage))] : 750+(arcIndex-6)*180+Math.max(0,Math.min(6,stage))*25;
}
