import { createElement } from 'react';

// The pictures are 2D renders of the main site's 3D models (scripts/diameter-art: sort.json + sort-cards.py).
const PICS = import.meta.glob('./art/*.webp', { eager: true, query: '?url', import: 'default' });
const pic = (id, alt) => () => createElement('img', { className: 'mg-pic', src: PICS[`./art/${id}.webp`], alt, draggable: false });

// Both Group Sort modes play the same two stages, taken from the main site's lessons. Each stage has three groups
// (a picture each) and nine facts, three per group: Picture Match ties each fact to its picture, Conveyor Sort packs
// each fact's crate into its group.
export const STAGES = [
  {
    id: 'types',
    title: 'Three types of muscle',
    lesson: 'Cardiac and smooth muscle tissue',
    groups: [
      { id: 'skeletal', label: 'Skeletal', Art: pic('skeletal', 'Skeletal muscle of the arm, on the bones') },
      { id: 'cardiac', label: 'Cardiac', Art: pic('cardiac', 'Branched cardiac muscle cells joined end to end') },
      { id: 'smooth', label: 'Smooth', Art: pic('smooth', 'A spindle-shaped smooth muscle cell') },
    ],
    facts: [
      { answer: 'skeletal', text: 'Many nuclei at the edge of the cell', why: 'Skeletal fibers have multiple, peripheral nuclei.' },
      { answer: 'skeletal', text: 'Generally under voluntary control', why: 'Only skeletal muscle is generally voluntary.' },
      { answer: 'skeletal', text: 'Attached to the skeleton for movement and posture', why: 'Skeletal muscle pulls on the skeleton.' },
      { answer: 'cardiac', text: 'Cells joined by intercalated discs', why: 'Intercalated discs join cardiac cells end to end.' },
      { answer: 'cardiac', text: 'Short, branched cells, one central nucleus', why: 'Cardiac cells branch and usually have one central nucleus.' },
      { answer: 'cardiac', text: 'Striated but involuntary; pumps blood', why: 'Cardiac muscle has sarcomeres yet is involuntary, and forms the heart wall.' },
      { answer: 'smooth', text: 'Spindle-shaped cells, no striations', why: 'Smooth muscle has no organized sarcomeres, so it is not striated.' },
      { answer: 'smooth', text: 'Calmodulin, not troponin, senses Ca²⁺', why: 'Smooth muscle uses calmodulin instead of troponin.' },
      { answer: 'smooth', text: 'Walls of hollow organs and blood vessels', why: 'Gut, bladder, uterus and vessels contain smooth muscle.' },
    ],
  },
  {
    id: 'layers',
    title: 'Inside skeletal muscle',
    lesson: 'Skeletal muscle tissue and the muscle fiber',
    groups: [
      { id: 'muscle', label: 'Whole muscle', Art: pic('muscle', 'The biceps on its own, with its tendons') },
      { id: 'fascicle', label: 'Fascicle', Art: pic('fascicle', 'A fascicle: a bundle of muscle fibers') },
      { id: 'fiber', label: 'Muscle fiber', Art: pic('fiber', 'One muscle fiber') },
    ],
    facts: [
      { answer: 'muscle', text: 'Wrapped by the epimysium', why: 'The epimysium surrounds the entire muscle.' },
      { answer: 'muscle', text: 'An organ: fibers plus connective tissue, vessels and nerves', why: 'A skeletal muscle is an organ, not just muscle cells.' },
      { answer: 'muscle', text: 'Its outer layer may merge with the deep fascia', why: 'The epimysium may merge with the deep fascia of neighboring muscles.' },
      { answer: 'fascicle', text: 'Wrapped by the perimysium', why: 'Each fascicle is enclosed by the perimysium.' },
      { answer: 'fascicle', text: 'A bundle of muscle fibers', why: 'Muscle fibers are grouped into bundles called fascicles.' },
      { answer: 'fascicle', text: 'Its wrapping carries blood vessels and nerves', why: 'The perimysium provides pathways for blood vessels and nerves.' },
      { answer: 'fiber', text: 'Wrapped by the endomysium', why: 'The endomysium is a delicate layer around each muscle fiber.' },
      { answer: 'fiber', text: 'One long, cylindrical, multinucleated cell', why: 'A skeletal muscle fiber is one long multinucleated cell.' },
      { answer: 'fiber', text: 'Has T-tubules and a sarcoplasmic reticulum', why: 'T-tubules and the SR lie in each fiber, around its myofibrils.' },
    ],
  },
];

export const TOTAL_FACTS = STAGES.reduce((n, st) => n + st.facts.length, 0);
export const groupOf = (stage, id) => stage.groups.find((g) => g.id === id);
