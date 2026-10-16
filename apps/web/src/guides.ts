export type Guide = {
  slug: string;
  kicker: string;
  title: string;
  image: string;
  alt: string;
  paragraphs: string[];
};

export const guides: Guide[] = [
  {
    slug: 'factors',
    kicker: 'GUIDE',
    title: 'How a process factor becomes a number',
    image: '/images/recycling-globe.jpg',
    alt: 'Illustration of a recycling globe.',
    paragraphs: [
      'Each published factor pairs a process with a reference unit, such as one kilogram of material or one piece of product.',
      'When you enter a quantity, the calculator converts it to that reference unit and multiplies it by the factor for each indicator. Check the unit shown next to each factor before you enter a quantity.',
    ],
  },
  {
    slug: 'indicators',
    kicker: 'EXPLAINER',
    title: 'Reading the 16 EF 3.1 indicators',
    image: '/images/recycling-icon.jpg',
    alt: 'Recycling icon.',
    paragraphs: [
      'The Environmental Footprint 3.1 method reports 16 impact categories, including climate change, water use, land use, and resource use.',
      'Each indicator has its own unit, so values cannot be added together or ranked across indicators without a separate weighting step. The results table shows each indicator on its own line.',
    ],
  },
  {
    slug: 'scope',
    kicker: 'NEWS',
    title: 'Why results are not whole-product footprints',
    image: '/images/recycling-tshirt-cropped.jpg',
    alt: 'Illustration of a green recycling T-shirt held in a hand, with leaves and a hanger.',
    paragraphs: [
      'This tool sums the processes you select. It does not model every upstream supplier, transport leg, use phase, or end-of-life step for a finished item.',
      'Treat a result as the impact of the processes you chose, and state that scope whenever you share it.',
    ],
  },
];

export function guideFromHash(hash: string): Guide | undefined {
  const match = /^#\/guides\/([a-z-]+)$/.exec(hash);
  return guides.find((guide) => guide.slug === match?.[1]);
}
