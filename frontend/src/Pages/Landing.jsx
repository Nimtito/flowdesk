
import { Link } from "react-router-dom";
import "./Landing.css";

const features = [
  {
    number: "01",
    title: "Project management",
    description:
      "Organize projects, define priorities, track deadlines, and keep every project moving forward.",
    icon: "▦",
  },
  {
    number: "02",
    title: "Task tracking",
    description:
      "Break projects into manageable tasks, assign responsibilities, and monitor progress.",
    icon: "✓",
  },
  {
    number: "03",
    title: "Team collaboration",
    description:
      "Keep team members aligned with shared projects, task discussions, and notifications.",
    icon: "◎",
  },
  {
    number: "04",
    title: "Progress reports",
    description:
      "Understand completed work, pending tasks, project progress, and team workload.",
    icon: "↗",
  },
];

function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">F</span>
          FlowDesk
        </Link>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="nav-login">
            Sign in
          </Link>
          <Link to="/register" className="button button-small">
            Get started <span>→</span>
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot" />
              A clearer way to build together
            </div>

            <h1>
              Great work starts
              <br />
              with <span>clear direction.</span>
            </h1>

            <p className="hero-description">
              Plan projects, organize tasks, and bring your
              development team together in one workspace.
              FlowDesk helps turn busy workflows into meaningful progress.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="button">
                Start managing projects <span>→</span>
              </Link>
              <a href="#features" className="button-secondary">
                Explore features
              </a>
            </div>

            <div className="hero-note">
              <span className="note-check">✓</span>
              Projects, tasks, and teamwork in one place
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />
            <div className="workspace">
              <div className="workspace-top">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>FLOWDESK / WORKSPACE</span>
                <span className="live-label">● Workspace</span>
              </div>

              <div className="workspace-body">
                <aside className="workspace-sidebar">
                  <div className="mini-brand">F</div>
                  <div className="mini-nav active">▦</div>
                  <div className="mini-nav">✓</div>
                  <div className="mini-nav">◎</div>
                  <div className="mini-nav">▤</div>
                </aside>

                <div className="workspace-main">
                  <div className="workspace-greeting">
                    <div>
                      <span className="mini-caption">YOUR WORKSPACE</span>
                      <h3>Project overview</h3>
                    </div>
                    <span className="avatar">FD</span>
                  </div>

                  <div className="stat-grid">
                    <div className="stat-card">
                      <span>Projects</span>
                      <strong>Organized</strong>
                      <small>One shared view</small>
                    </div>
                    <div className="stat-card">
                      <span>Tasks</span>
                      <strong>On track</strong>
                      <small>Clear ownership</small>
                    </div>
                  </div>

                  <div className="preview-panel">
                    <div className="preview-heading">
                      <strong>Project workflow</strong>
                      <span>Overview</span>
                    </div>
                    <div className="workflow-row">
                      <span className="workflow-icon purple">▦</span>
                      <div className="workflow-text">
                        <strong>Plan the work</strong>
                        <small>Projects and priorities</small>
                      </div>
                      <span className="workflow-status">Organized</span>
                    </div>
                    <div className="workflow-row">
                      <span className="workflow-icon green">✓</span>
                      <div className="workflow-text">
                        <strong>Move tasks forward</strong>
                        <small>Assignments and deadlines</small>
                      </div>
                      <span className="workflow-status">In progress</span>
                    </div>
                    <div className="workflow-row">
                      <span className="workflow-icon orange">↗</span>
                      <div className="workflow-text">
                        <strong>Review progress</strong>
                        <small>Reports and activity</small>
                      </div>
                      <span className="workflow-status">Visible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-note">
              <span className="floating-check">✓</span>
              <div>
                <strong>Work with clarity</strong>
                <small>Everyone knows the next step</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>BUILT FOR THE WAY TEAMS WORK</span>
          <div>PROJECTS <i /> TASKS <i /> COLLABORATION <i /> REPORTING</div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="section-kicker">ONE CONNECTED WORKSPACE</span>
            <h2>Everything moving in the same direction.</h2>
            <p>
              Bring planning, execution, and progress together
              without losing sight of the bigger picture.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <div className="feature-top">
                  <span className="feature-icon">{feature.icon}</span>
                  <span className="feature-number">{feature.number}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-copy">
            <span className="section-kicker">SIMPLE BY DESIGN</span>
            <h2>From scattered work to shared progress.</h2>
            <p>
              Give your team a practical place to organize
              responsibilities, collaborate on tasks, and see
              how work is progressing.
            </p>
          </div>
          <div className="steps-list">
            <div className="step">
              <span>01</span>
              <div>
                <h3>Set up your projects</h3>
                <p>Define the work, priorities, and deadlines.</p>
              </div>
            </div>
            <div className="step">
              <span>02</span>
              <div>
                <h3>Coordinate the work</h3>
                <p>Assign tasks and keep conversations connected.</p>
              </div>
            </div>
            <div className="step">
              <span>03</span>
              <div>
                <h3>Track the outcome</h3>
                <p>Review progress and make informed decisions.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span className="section-kicker">YOUR WORK. ONE WORKSPACE.</span>
            <h2>Make the next project clearer.</h2>
            <p>Bring your projects, tasks, and team into FlowDesk.</p>
          </div>
          <Link to="/register" className="button cta-button">
            Create your account <span>→</span>
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="brand">
          <span className="brand-mark">F</span>
          FlowDesk
        </Link>
        <span>Project work, made clearer.</span>
        <span>© {new Date().getFullYear()} FlowDesk</span>
      </footer>
    </div>
  );
}

export default Landing;
