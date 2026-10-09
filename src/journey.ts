import { Castle, DoorOpen, Wind } from "lucide-react";
// Presentation metadata, separate from walking rewards and persisted distance.
export const landmarks = [
  {
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
