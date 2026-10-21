import { createElement } from 'react';
import { CardiacArt, HierarchyArt, SkeletalArt, SmoothArt } from '../../art.jsx';

// OL2 — differentiate skeletal, cardiac and smooth muscle (lecture §3, §14–16, §20).
export const GROUPS = [
  { id: 'skeletal', label: 'Skeletal', Art: SkeletalArt },
  { id: 'cardiac', label: 'Cardiac', Art: CardiacArt },
  { id: 'smooth', label: 'Smooth', Art: SmoothArt },
];
export const groupLabel = (id) => GROUPS.find((g) => g.id === id).label;

export const IMAGE_CARDS = [
  { answer: 'skeletal', Art: SkeletalArt, text: 'Striated fibers, many peripheral nuclei', why: 'Long cylindrical fibers, clear striations and many nuclei pushed to the edge.' },
  { answer: 'cardiac', Art: CardiacArt, text: 'Branched cells with intercalated discs', why: 'Branched striated cells, one central nucleus, joined end-to-end by intercalated discs.' },
  { answer: 'smooth', Art: SmoothArt, text: 'Spindle cells, no striations', why: 'Spindle-shaped cells with one central nucleus and no striations.' },
];

export const TEXT_CARDS = [
  { answer: 'skeletal', text: 'Many nuclei at the edge of the cell', why: 'Skeletal fibers are multinucleated with peripheral nuclei.' },
  { answer: 'skeletal', text: 'Generally under voluntary control', why: 'Only skeletal muscle is generally voluntary.' },
  { answer: 'skeletal', text: 'Attached to bones for movement and posture', why: 'Skeletal muscle pulls on the skeleton.' },
  { answer: 'skeletal', text: 'SO, FOG and FG fiber types', why: 'Slow oxidative, fast oxidative–glycolytic and fast glycolytic fibers are skeletal fiber types.' },
  { answer: 'skeletal', text: 'Repaired by satellite cells', why: 'Satellite cells beneath the basal lamina regenerate skeletal fibers.' },
  { answer: 'cardiac', text: 'Intercalated discs', why: 'Intercalated discs join cardiac cells end-to-end.' },
  { answer: 'cardiac', text: 'Desmosomes + gap junctions link cells', why: 'These provide mechanical and electrical coupling in the heart.' },
  { answer: 'cardiac', text: 'Short, branched cells, one central nucleus', why: 'Cardiac cells branch and usually have one central nucleus.' },
  { answer: 'cardiac', text: 'Striated but involuntary', why: 'Cardiac muscle has sarcomeres (striated) yet is involuntary.' },
  { answer: 'cardiac', text: 'Pumps blood', why: 'Cardiac muscle forms the wall of the heart.' },
  { answer: 'smooth', text: 'Calmodulin is the main Ca²⁺ sensor', why: 'Smooth muscle uses calmodulin instead of troponin.' },
  { answer: 'smooth', text: 'Dense bodies instead of Z discs', why: 'Dense bodies anchor filaments, broadly like Z discs.' },
  { answer: 'smooth', text: 'No T-tubules; has caveolae', why: 'Smooth muscle lacks T-tubules and uses caveolae for Ca²⁺ handling.' },
  { answer: 'smooth', text: 'Walls of hollow organs and blood vessels', why: 'Gut, bladder, uterus and vessels contain smooth muscle.' },
  { answer: 'smooth', text: 'Single-unit and multiunit types', why: 'Visceral (single-unit) vs multiunit, e.g. iris, airways, large vessels.' },
  { answer: 'smooth', text: 'No sarcomeres, so no striations', why: 'Filaments form an irregular network in smooth muscle.' },
];

const hierarchy = (kind) => () => createElement(HierarchyArt, { kind });

// Picture Match pairs: a picture card matched with its name card, or (later rounds) with a key feature.
export const PAIRS = [
  { id: 'skeletal', name: 'Skeletal muscle', clue: 'Striated, many nuclei at the edge', Art: SkeletalArt, why: 'Striated, cylindrical, many peripheral nuclei.' },
  { id: 'cardiac', name: 'Cardiac muscle', clue: 'Branched cells joined by intercalated discs', Art: CardiacArt, why: 'Branched, striated, intercalated discs.' },
  { id: 'smooth', name: 'Smooth muscle', clue: 'Spindle cells, no striations', Art: SmoothArt, why: 'Spindle-shaped, no striations.' },
  { id: 'muscle', name: 'Whole muscle', clue: 'Wrapped by epimysium, joined to bone by tendons', Art: hierarchy('muscle'), why: 'The organ, wrapped by epimysium and joined to bone by tendons.' },
  { id: 'fascicle', name: 'Fascicle', clue: 'Bundle of fibers wrapped by perimysium', Art: hierarchy('fascicle'), why: 'A bundle of muscle fibers wrapped by perimysium.' },
  { id: 'fiber', name: 'Muscle fiber', clue: 'One multinucleated cell wrapped by endomysium', Art: hierarchy('fiber'), why: 'One multinucleated muscle cell wrapped by endomysium.' },
  { id: 'myofibril', name: 'Myofibril', clue: 'Rod of repeating sarcomeres', Art: hierarchy('myofibril'), why: 'A rod of repeating sarcomeres inside the fiber.' },
  { id: 'sarcomere', name: 'Sarcomere', clue: 'Z disc to Z disc — the contractile unit', Art: hierarchy('sarcomere'), why: 'Z disc to Z disc: the basic contractile unit.' },
  { id: 'filaments', name: 'Actin + myosin', clue: 'Thin and thick myofilaments', Art: hierarchy('filaments'), why: 'Thin (actin) and thick (myosin) myofilaments.' },
];
