/**
 * CreditsScreen - Asset attribution overlay
 *
 * Credits every 3D model, sound, and texture to its creator with source
 * links. Ship/invader models are CC-BY-4.0 (attribution required); audio,
 * texture, and HDRI assets are CC0 (credited as a courtesy).
 *
 * Mirrors the machine-readable attribution files in public/models/,
 * public/sounds/, public/textures/, and public/hdri/ — update both when
 * assets change.
 */

interface Credit {
  title: string;
  author: string;
  url: string;
}

const SHIP_MODELS: Credit[] = [
  { title: 'Spaceship (Rocketship)', author: 'motaman', url: 'https://sketchfab.com/3d-models/spaceship-0a073d0ab9a64b408056e82f7628b188' },
  { title: 'Guardians of the Galaxy Milano', author: 'razzie_mbessai', url: 'https://sketchfab.com/3d-models/guardians-of-the-galaxy-milano-mandela-spaceship-d41dfa4b160e403db99f1c3bbe06dcfc' },
  { title: 'Planet Express SpaceShip', author: 'Raver', url: 'https://sketchfab.com/3d-models/planet-express-spaceship-51eb6b7e17954c3fadd9a5c100f451b8' },
  { title: "Rick's ship from Rick and Morty", author: 'Micheal-Holloway', url: 'https://sketchfab.com/3d-models/ricks-ship-from-rick-and-morty-71dce3dd627146e9a1e4776a490e786b' },
  { title: 'Vegeta SpaceShip (Saiyan Capsule)', author: 'Noddity', url: 'https://sketchfab.com/3d-models/vegeta-spaceship-1f8b0948a55c465b99f93fbcb0a21502' },
  { title: 'Space Shuttle', author: 'ASHISH', url: 'https://sketchfab.com/3d-models/space-shuttle-892969a88e71495d9e869f96c95f0abf' },
  { title: 'SpaceX Starship', author: 'MartianDays', url: 'https://sketchfab.com/3d-models/spacex-starship-a8a0b69f776841a1a465cd9fb3762fd2' },
  { title: '3D T.I.E Fighter - Star Wars', author: 'Mickael Boitte', url: 'https://sketchfab.com/3d-models/3d-tie-fighter-star-wars-model-5375de94c2484ab0b2a2bd75aa63c2b4' },
  { title: 'Dragon Ball Time Machine', author: 'InvisibleSpanish', url: 'https://sketchfab.com/3d-models/dragon-ball-time-machine-5d1ba82a7bdc4398aaa7e316ba1bce87' },
];

const INVADER_MODELS: Credit[] = [
  { title: 'Invader 1, Invader 5 & Boss Invader', author: 'nitwit.friends', url: 'https://sketchfab.com/nitwit.friends' },
  { title: 'Space Invader #3', author: 'alban', url: 'https://sketchfab.com/alban' },
];

const AUDIO_AND_ART: Credit[] = [
  { title: 'Laser, explosion & UI sound effects', author: 'Kenney (kenney.nl)', url: 'https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc' },
  { title: 'Music: Outer Space Loop', author: 'agameraaron', url: 'https://opengameart.org/content/outer-space-loop' },
  { title: 'Nebula backdrop', author: 'Screaming Brain Studios', url: 'https://opengameart.org/content/seamless-space-backgrounds' },
  { title: 'Night HDRI: Dikhololo Night', author: 'Greg Zaal (Poly Haven)', url: 'https://polyhaven.com/a/dikhololo_night' },
];

function CreditList({ heading, license, credits }: { heading: string; license: string; credits: Credit[] }) {
  return (
    <section className="credits-section">
      <h2>
        {heading} <span className="credits-license">{license}</span>
      </h2>
      {credits.map((credit) => (
        <div className="credits-row" key={credit.url + credit.title}>
          <a href={credit.url} target="_blank" rel="noopener noreferrer">
            {credit.title}
          </a>
          <span className="credits-author">by {credit.author}</span>
        </div>
      ))}
    </section>
  );
}

interface CreditsScreenProps {
  onClose: () => void;
}

export function CreditsScreen({ onClose }: CreditsScreenProps) {
  return (
    <div className="menu-overlay credits-screen">
      <h1>CREDITS</h1>

      <div className="credits-panel">
        <CreditList heading="SHIP MODELS" license="CC-BY-4.0 via Sketchfab" credits={SHIP_MODELS} />
        <CreditList heading="INVADER MODELS" license="CC-BY-4.0 via Sketchfab" credits={INVADER_MODELS} />
        <CreditList heading="AUDIO & ART" license="CC0" credits={AUDIO_AND_ART} />
      </div>

      <button onClick={onClose}>BACK</button>
    </div>
  );
}
