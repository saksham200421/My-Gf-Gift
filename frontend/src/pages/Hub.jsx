import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const tiles = [
  {
    id: "01",
    label: "Center",
    colSpan: 6,
    rowSpan: 6,
    colSpanMobile: 2,
    rowSpanMobile: 2,
  },
  {
    id: "02",
    label: "Love Notes",
    colSpan: 3,
    rowSpan: 4,
    colSpanMobile: 1,
    rowSpanMobile: 1,
  },
  {
    id: "03",
    label: "Playlist",
    colSpan: 3,
    rowSpan: 2,
    colSpanMobile: 1,
    rowSpanMobile: 1,
  },
  {
    id: "05",
    label: "Photo Wall",
    colSpan: 3,
    rowSpan: 2,
    colSpanMobile: 1,
    rowSpanMobile: 1,
  },
  {
    id: "06",
    label: "Reasons",
    colSpan: 6,
    rowSpan: 2,
    colSpanMobile: 2,
    rowSpanMobile: 1,
  },
];

function Hub() {
  const [selectedId, setSelectedId] = useState("02");
  const navigate = useNavigate();

  const contentMap = useMemo(
    () => ({
      "02": (
        <div className="hub-chat">
          <div className="hub-chat-top">
            <div className="hub-chat-brand">
              <span className="hub-chat-logo">chatline</span>
              <span className="hub-chat-tag">meet someone new</span>
            </div>
          </div>
          <div className="hub-chat-status">
            You are chatting with someone new. Say hi!
          </div>
          <div className="hub-chat-stream">
            <div className="hub-chat-row hub-chat-row--them">
              <span className="hub-chat-avatar">M</span>
              <div className="hub-chat-bubble hub-chat-bubble--them">
                hey!
              </div>
            </div>
            <div className="hub-chat-row hub-chat-row--you">
              <div className="hub-chat-bubble hub-chat-bubble--you">
                hi there :)
              </div>
            </div>
            <div className="hub-chat-row hub-chat-row--them">
              <span className="hub-chat-avatar">O</span>
              <div className="hub-chat-bubble hub-chat-bubble--them">
                whats your favorite song lately?
              </div>
            </div>
            <div className="hub-chat-row hub-chat-row--you">
              <div className="hub-chat-bubble hub-chat-bubble--you">
                anything soft and acoustic
              </div>
            </div>
            <div className="hub-chat-system">Stranger has disconnected.</div>
          </div>
          <div className="hub-chat-footer">
            <button className="hub-chat-new" type="button">
              New
            </button>
            <button className="hub-chat-log" type="button">
              Save chat
            </button>
          </div>
          <div className="hub-chat-input">
            <div className="hub-chat-input-row">
              <input
                type="text"
                placeholder="Type your message..."
                aria-label="Chat message"
              />
              <button type="button">Send</button>
            </div>
          </div>
        </div>
      ),
      "03": (
        <div className="hub-chatzone">
          <div className="hub-chatzone-box">
            <div className="hub-chatzone-box-header">
              <div className="hub-chatzone-square">ChatZone</div>
            </div>
            <div className="hub-chatzone-system hub-chatzone-system--top">
              You are chatting with a random stranger. Say hi!
            </div>
            <div className="hub-chatzone-message hub-chatzone-left">Oscar</div>
            <div className="hub-chatzone-message hub-chatzone-right">
              Codename?
            </div>
            <div className="hub-chatzone-message hub-chatzone-left">Oscar</div>
            <div className="hub-chatzone-message hub-chatzone-right">
              Codename accepted
            </div>
            <div className="hub-chatzone-message hub-chatzone-left">Right</div>
            <div className="hub-chatzone-message hub-chatzone-right">
              What is your request, agent Oscar?
            </div>
            <div className="hub-chatzone-message hub-chatzone-left">
              Movie night
            </div>
            <div className="hub-chatzone-message hub-chatzone-right">
              Movie night coming up shortly.
            </div>
            <div className="hub-chatzone-system">Stranger has disconnected.</div>
            <div className="hub-chatzone-actions">
              <button type="button">Send</button>
              <input type="text" placeholder="Type your message..." />
            </div>
          </div>
        </div>
      ),
      "05": (
        <div className="hub-demo">
          <h3>Photo Wall</h3>
          <p>Save our favorite memories.</p>
          <div className="hub-demo-row">
            <span>Trip</span>
            <span>Smile</span>
            <span>Hugs</span>
          </div>
          <button type="button">View</button>
        </div>
      ),
      "06": (
        <div className="hub-demo">
          <h3>Reasons</h3>
          <p>Why I love you, page by page.</p>
          <div className="hub-demo-row">
            <span>Kind</span>
            <span>Warm</span>
            <span>Us</span>
          </div>
          <button type="button" onClick={() => navigate("/marry-me")}>
            Wedding Certificate
          </button>
        </div>
      ),
    }),
    [navigate]
  );

  const renderTileContent = (id, size) => (
    <div className={`hub-tile-content hub-tile-content--${size}`}>
      {contentMap[id] || <div className="hub-empty">{id}</div>}
    </div>
  );

  return (
    <main className="hub-page">
      <section className="hub-grid">
        {tiles.map((tile) => {
          const tileStyle = {
            "--col-span": tile.colSpan,
            "--row-span": tile.rowSpan,
            "--col-span-mobile": tile.colSpanMobile,
            "--row-span-mobile": tile.rowSpanMobile,
          };

          if (tile.id === "01") {
            return (
              <div
                className="hub-tile hub-tile--main"
                key={tile.id}
                style={tileStyle}
              >
                <div className="hub-main">
                  <div className="hub-main-content">
                    {renderTileContent(selectedId, "main")}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              className={`hub-tile hub-tile--button${
                selectedId === tile.id ? " hub-tile--active" : ""
              }`}
              key={tile.id}
              style={{
                ...tileStyle,
                overflow: "scroll",
              }}
              type="button"
              onClick={() => setSelectedId(tile.id)}
            >
              {renderTileContent(tile.id, "compact")}
            </button>
          );
        })}
      </section>
    </main>
  );
}

export default Hub;
