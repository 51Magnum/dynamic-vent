import { useState } from "react";
import { Link } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

const galleryImage = (number) =>
  number <= 4 ? `/gallery${number}-retouched.png` : `/gallery${number}.jpg`;

export default function Home() {
  const [index, setIndex] = useState(-1);
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">THE DETAIL THAT MAKES THE DIFFERENCE</p>
          <h1>
            Beautiful floors.
            <br />
            Every <em>last detail.</em>
          </h1>
          <p className="hero-description">
            Meet the floor vent that belongs in your space. Precision-cut
            aluminum, distinctive patterns, and a flush fit that lets your floor
            take the lead.
          </p>
          <div className="button-row">
            <Link className="button" to="/shop">
              Find your finish <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" to="/how-it-works">
              See how it works <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="small-mark" aria-hidden="true">
              {"///"}
            </span>{" "}
            Designed for hardwood. Made to blend in.
          </div>
        </div>
        <div className="hero-image">
          <img
            src={galleryImage(1)}
            alt="A precision-cut DynamicVent sitting flush in a herringbone wood floor"
            fetchPriority="high"
          />
          <div className="image-caption">
            <span>THE FLUSH-MOUNT COLLECTION</span>
            <span>01 / DynamicVent</span>
          </div>
        </div>
      </section>
      <div className="feature-strip">
        <div className="container">
          <span>Precision-cut aluminum</span>
          <span>7 standard sizes</span>
          <span>6 considered finishes</span>
          <span>Optional airflow control</span>
        </div>
      </div>
      <section className="container section intro-section">
        <p className="eyebrow">SMALL DETAIL. BIG DIFFERENCE.</p>
        <div className="intro-grid">
          <h2>
            Your floor has a style.
            <br />
            Your vent should too.
          </h2>
          <p>
            Replace the raised, everyday register with something more
            considered. DynamicVent sits flush with your wood floor, bringing
            clean lines and a finish that feels intentional.
          </p>
        </div>
      </section>
      <section className="container collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h2>A pattern for your perspective.</h2>
          </div>
          <Link className="text-link" to="/shop">
            Explore all designs →
          </Link>
        </div>
        <div className="design-grid">
          {[
            {
              image: 1,
              title: "A little geometry.",
              text: "Clean shapes. A distinctly modern finish.",
            },
            {
              image: 2,
              title: "Room for character.",
              text: "A detail that makes the space your own.",
            },
            {
              image: 3,
              title: "Made to fit in.",
              text: "A flush profile that works with your floor.",
            },
          ].map((item) => (
            <Link className="design-card" to="/shop" key={item.image}>
              <div className="design-image">
                <img
                  src={galleryImage(item.image)}
                  alt={`Installed DynamicVent floor vent, design example ${item.image}`}
                  loading="lazy"
                />
                <span aria-hidden="true">↗</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="installation-feature">
        <div className="container installation-grid">
          <div className="installation-photo">
            <img
              src="/step4-drop.jpg"
              alt="Placing the vent into its prepared opening"
              loading="lazy"
            />
          </div>
          <div>
            <p className="eyebrow">A SEAMLESS FIT STARTS HERE</p>
            <h2>
              A thoughtful system.
              <br />A cleaner finish.
            </h2>
            <p>
              Align the template, route the recess, and drop in your vent.
              Explore the installation process and find the right tools for your
              project.
            </p>
            <Link className="button button-light" to="/how-it-works">
              Explore installation <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE DETAILS, IN REAL LIFE</p>
            <h2>See it in place.</h2>
          </div>
          <p>
            Real floors. Real possibilities.
            <br />
            Select a photo for a closer look.
          </p>
        </div>
        <div className="gallery-grid">
          {Array.from({ length: 15 }, (_, i) => (
            <button
              key={i}
              className="gallery-button"
              aria-label={`Enlarge installed vent photo ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <img
                src={galleryImage(i + 1)}
                alt={`DynamicVent installed in wood flooring, example ${i + 1}`}
                loading="lazy"
              />
              <span aria-hidden="true">+</span>
            </button>
          ))}
        </div>
        <Lightbox
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
          slides={Array.from({ length: 15 }, (_, i) => ({
            src: galleryImage(i + 1),
            alt: `Installed DynamicVent example ${i + 1}`,
          }))}
          plugins={[Zoom]}
        />
      </section>
      <section className="project-cta">
        <div className="container">
          <p className="eyebrow">YOUR NEXT FINISHING TOUCH</p>
          <h2>Bring the whole room together.</h2>
          <p>Choose your size, find your pattern, and make it yours.</p>
          <Link className="button" to="/shop">
            Design your DynamicVent ↗
          </Link>
        </div>
      </section>
    </>
  );
}
