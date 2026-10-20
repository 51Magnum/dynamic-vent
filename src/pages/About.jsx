export default function About() {
  return (
    <div className="container section">
      <div className="page-intro">
        <p className="eyebrow">DESIGNED IN NAMPA, IDAHO</p>
        <h1>About DynamicVent</h1>
      </div>
      <div className="story-grid">
        <img
          src="/images/about-installed.webp"
          alt="DynamicVent installed flush in a hardwood floor"
          loading="lazy"
        />
        <div>
          <p>
            I got tired of walking across beautiful hardwood floors and seeing
            cheap, stamped metal vents sitting on top of them. They looked out
            of place in a nice home, and our robot vacuum kept getting stuck on
            them.
          </p>
          <p>
            So I designed something better. DynamicVent vents sit flush with the
            floor, so there's nothing to trip over or snag on. They're made from
            aluminum, with patterns or custom wording cut right in, and you can
            choose a painted or powder-coated finish. I designed every part
            myself and installed them throughout my own house in Nampa, Idaho,
            before offering them to anyone else.
          </p>
          <p>
            If you care about how your floors look, your vents should look just
            as good.
          </p>
          <p>
            Questions or custom orders? Email us at{" "}
            <a className="text-link" href="mailto:sales@dynamicvent.com">
              sales@dynamicvent.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
