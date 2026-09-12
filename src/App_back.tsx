import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const completedPrefectures = [
    "北海道",
    "東京都",
    "大阪府",
  ];

  const raceData = {
    北海道: [
      {
        race: "北海道マラソン2024",
        date: "2024-08-25",
        time: "03:32:10",
      },
      {
        race: "北海道マラソン2025",
        date: "2025-08-31",
        time: "03:28:15",
      },
    ],

    東京都: [
      {
        race: "東京マラソン2025",
        date: "2025-03-02",
        time: "03:35:20",
      },
    ],

    大阪府: [
      {
        race: "大阪マラソン2025",
        date: "2025-02-24",
        time: "03:41:10",
      },
    ],
  };

  const [prefectures, setPrefectures] = useState<string[]>([]);

  const [selectedPrefecture, setSelectedPrefecture] =
    useState<string | null>(null);

  useEffect(() => {
    fetch("/japan.geojson")
      .then((response) => response.json())
      .then((data) => {
        const names = data.features.map(
          (feature: any) => feature.properties.name
        );

        setPrefectures(names);
      })
      .catch((error) => {
        console.error("GeoJSON読込エラー:", error);
      });
  }, []);

  return (
    <div className="container">
      <h1>🏃 ランニング都道府県マップ</h1>

      <div className="summary">
        <h2>制覇率 {completedPrefectures.length} / 47</h2>
      </div>

      <div className="map-area">
        <div>
          <h3>都道府県一覧</h3>

          <div className="prefecture-grid">
            {prefectures.map((pref) => (
              <div
                key={pref}
                className={`prefecture-tile ${
                  completedPrefectures.includes(pref)
                    ? "completed"
                    : ""
                }`}
                onClick={() => setSelectedPrefecture(pref)}
              >
                {pref}
              </div>
            ))}
          </div>
          {selectedPrefecture &&
            raceData[selectedPrefecture as keyof typeof raceData] && (
              <div className="race-card">
                <h3>{selectedPrefecture}</h3>

                {raceData[
                  selectedPrefecture as keyof typeof raceData
                ].map((race, index) => (
                  <div key={index} className="race-item">
                    <p>大会名：{race.race}</p>
                    <p>日付：{race.date}</p>
                    <p>タイム：{race.time}</p>
                    <hr />
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;