import "./App.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { raceData as initialRaceData } from "./data/raceData";
import * as turf from "@turf/turf";



function App() {

  const getPrefectureFromCoordinates = (
    latitude: number,
    longitude: number
  ) => {
    if (!geoData) return null;

    const point = turf.point([
      longitude,
      latitude,
    ]);

    for (const feature of geoData.features) {
      try {
        if (
          turf.booleanPointInPolygon(
            point,
            feature
          )
        ) {
          return feature.properties.name;
        }
      } catch (error) {
        console.error(error);
      }
    }

    return null;
  };


  const [raceData, setRaceData] =
    useState(initialRaceData);

  const [selectedPrefecture, setSelectedPrefecture] =
    useState<string | null>(null);

  const [showMenu, setShowMenu] =
    useState(false);
  
  const [menuPage, setMenuPage] =
    useState("");
  
  const [raceFilter, setRaceFilter] =
    useState("all");

  const filteredPrefectures =
    Object.keys(raceData).filter(
      (prefecture) => {

        if (raceFilter === "all")
          return true;

        return raceData[
          prefecture as keyof typeof raceData
        ].some(
          (race: any) =>
            race.type === raceFilter
        );
      }
    );



  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    const savedData =
      localStorage.getItem("raceData");

    if (savedData) {
      setRaceData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "raceData",
      JSON.stringify(raceData)
    );
  }, [raceData]);

  useEffect(() => {
    fetch("/japan.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  const [newPrefecture, setNewPrefecture] =
    useState("");

  const [newRaceName, setNewRaceName] =
    useState("");

  const [newRaceDate, setNewRaceDate] =
    useState("");

  const [newRaceTime, setNewRaceTime] =
    useState("");

  const [newDistance, setNewDistance] =
    useState("");
    
  const [newRaceType, setNewRaceType] =
    useState("full");

  const [newGarminUrl, setNewGarminUrl] =
    useState("");
  
  const handleAddRace = () => {
    if (
      !newPrefecture ||
      !newRaceName ||
      !newRaceDate ||
      !newRaceTime ||
      !newDistance ||
      !newRaceType
    ) {
      alert("全て入力してください");
      return;
    }

    const updatedRaceData: any = {
      ...raceData,

      [newPrefecture]: [
        ...(raceData[
          newPrefecture as keyof typeof raceData
        ] || []),
        {
          race: newRaceName,
          date: newRaceDate,
          time: newRaceTime,
          distance: newDistance,
          newGarminUrl: newGarminUrl,
        },
      ],
    };

    setRaceData(updatedRaceData);

    setNewPrefecture("");
    setNewRaceName("");
    setNewRaceDate("");
    setNewRaceTime("");
    setNewGarminUrl("");
    setNewRaceType("full");
  };

  const [editingRace, setEditingRace] =
    useState<any>(null);

  const handleSaveEdit = () => {

    const updatedRaceData: any =
      { ...raceData };

    updatedRaceData[
      editingRace.prefecture
    ][editingRace.index] = {

      race: editingRace.race,
      date: editingRace.date,
      time: editingRace.time,
      distance: editingRace.distance,
      type: editingRace.type,
      garminUrl: editingRace.garminUrl,
    };

    setRaceData(updatedRaceData);

    setEditingRace(null);
  };
      
  const handleDeleteRace = (
    prefecture: string,
    indexToDelete: number
  ) => {

    const prefectureRaces =
      raceData[
        prefecture as keyof typeof raceData
      ] || [];

    const updatedPrefectureRaces =
      prefectureRaces.filter(
        (_, index) => index !== indexToDelete
      );

    const updatedRaceData: any = {
      ...raceData,
      updatedPrefectureRaces,
    };

    if (updatedPrefectureRaces.length === 0) {
      const tempData = { ...updatedRaceData};
      delete updatedRaceData[prefecture];
      setRaceData(tempData);
    }else{
      setRaceData(updatedRaceData);
    }

    setRaceData(updatedRaceData);
  };

  const handleGpxUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const gpxText =
        e.target?.result as string;

      const parser = new DOMParser();

      const xml =
        parser.parseFromString(
          gpxText,
          "text/xml"
        );

      const raceName =
        xml.querySelector("name")?.textContent;

      const firstTrackPoint =
        xml.querySelector("trkpt");

      const lat =
        firstTrackPoint?.getAttribute("lat");

      const lon =
        firstTrackPoint?.getAttribute("lon");
      
      const raceTimeTag =
        xml.querySelector("time");

      const raceDate =
        raceTimeTag?.textContent;

      const timeNodes =
        xml.querySelectorAll("trkpt time");

      const firstTime =
        timeNodes[0]?.textContent;

      const lastTime =
        timeNodes[
          timeNodes.length - 1
        ]?.textContent;

      const link =
        xml.querySelector("link");

      const garminUrl =
        link?.getAttribute("href");

      console.log("大会名", raceName);
      console.log("緯度", lat);
      console.log("経度", lon);
      console.log(gpxText);

      if (raceName) {
        setNewRaceName(raceName);
      }

      if (raceDate) {
        const date = raceDate
          .split("T")[0];

        setNewRaceDate(date);
      } 

      if (lat && lon) {
        const prefecture =
          getPrefectureFromCoordinates(
            Number(lat),
            Number(lon)
          );

        if (prefecture) {
          setNewPrefecture(prefecture);
        }
      }

      if (firstTime && lastTime) {

        const start =
          new Date(firstTime);

        const end =
          new Date(lastTime);

        const seconds =
          (end.getTime() -
          start.getTime()) / 1000;

        const hours =
          Math.floor(seconds / 3600);

        const minutes =
          Math.floor(
            (seconds % 3600) / 60
          );

        const remainingSeconds =
          Math.floor(seconds % 60);

        const formattedTime =
          `${hours
            .toString()
            .padStart(2, "0")}:` +
          `${minutes
            .toString()
            .padStart(2, "0")}:` +
          `${remainingSeconds
            .toString()
            .padStart(2, "0")}`;

        setNewRaceTime(formattedTime);
      }

      const trackPoints =
        xml.querySelectorAll("trkpt");
      const coordinates: number[][] = [];
      trackPoints.forEach((point) => {
        const lat = Number(
          point.getAttribute("lat")
        );
        const lon = Number(
          point.getAttribute("lon")
        );
        coordinates.push([lon, lat]);
      });
      if (coordinates.length > 1) {

        const line =
          turf.lineString(coordinates);

        const distance =
          turf.length(line, {
            units: "kilometers",
          });

        console.log(
          "距離:",
          distance
        );

        setNewDistance(
          distance.toFixed(2)
        );
      }

      if (garminUrl) {
        setNewGarminUrl(garminUrl);
      }

    };
    
    reader.readAsText(file);
  };

  const allRaces = Object.entries(raceData)
    .flatMap(([prefecture, races]) =>
      races.map((race: any) => ({
        prefecture,
        ...race,
      }))
    );

  const filteredRaces =
    raceFilter === "all"
      ? allRaces
      : allRaces.filter(
          (race) =>
            race.type === raceFilter
        );
  
  const timeToSeconds = (
    timeString: string
  ) => {

    return timeString
      .split(":")
      .reduce(
        (acc: number, value: string) =>
          60 * acc +
          Number(value),
        0
      );

  };

  const secondsToTime = (
    totalSeconds: number
  ) => {

    const hours =
      Math.floor(totalSeconds / 3600);

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      Math.floor(
        totalSeconds % 60
      );

    return `${hours
      .toString()
      .padStart(2, "0")}:${
        minutes
          .toString()
          .padStart(2, "0")
      }:${
        seconds
          .toString()
          .padStart(2, "0")
      }`;
  };
        
  const sortedRaces =
    [...filteredRaces];
  
  const [sortType, setSortType] =
    useState("date");

  if (sortType === "date") {

  sortedRaces.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

  }

  if (sortType === "time") {
    sortedRaces.sort(
      (a,b) =>
        timeToSeconds(a.time) -
        timeToSeconds(b.time)
    )
  }

  if (sortType === "year") {

    sortedRaces.sort(
      (a, b) =>
        Number(
          b.date.substring(0, 4)
        ) -
        Number(
          a.date.substring(0, 4)
        )
    );

  }

  const prefectureBestTimes: Record<
    string,
    number
  > = {};

  Object.entries(raceData).forEach(
    ([prefecture, races]) => {

      const targetRaces =
        races.filter(
          (race: any) =>
            raceFilter === "all" ||
            race.type === raceFilter
        );

      if (targetRaces.length === 0) {
        return;
      }

      prefectureBestTimes[prefecture] =
        Math.min(
          ...targetRaces.map(
            (race: any) =>
              timeToSeconds(
                race.time
              )
          )
        );

    }
  );

  const totalDistance =
    filteredRaces.reduce(
      (sum, race) =>
        sum +
        (Number(race.distance) || 0),
      0
    );

  const raceCount = filteredRaces.length

  const bestTimeSeconds =
    filteredRaces.length > 0
      ? Math.min(
          ...filteredRaces.map(
            (race) =>
              timeToSeconds(race.time)
          )
        )
      : 0;

  const averageTimeSeconds =
  filteredRaces.length > 0
    ? filteredRaces.reduce(
        (sum, race) =>
          sum +
          timeToSeconds(race.time),
        0
      ) / filteredRaces.length
    : 0;
  
  const bestRace =
    filteredRaces.length > 0
      ? filteredRaces.reduce(
          (best, current) =>

            timeToSeconds(current.time) <
            timeToSeconds(best.time)

              ? current
              : best
        )
      : null;

  const getPrefectureColor = (
    prefecture: string
  ) => {

    const bestTime =
      prefectureBestTimes[
        prefecture
      ];

    if (!bestTime)
      return "#E0E0E0";

    if (raceFilter === "full") {

      if (bestTime < 10800)
        return "#FF0000";

      if (bestTime < 12600)
        return "#FF9800";

      if (bestTime < 14400)
        return "#FFEB3B";

      if (bestTime < 16200)
        return "#4CAF50";

      return "#2196F3";
    }

    if (raceFilter === "half") {

      if (bestTime < 5400)
        return "#FF0000";

      if (bestTime < 6300)
        return "#FF9800";

      if (bestTime < 7200)
        return "#FFEB3B";

      if (bestTime < 9000)
        return "#4CAF50";

      return "#2196F3";
    }

    return "#2196F3";
  };

  const handleExportData = () => {

    const dataStr = JSON.stringify(
      raceData,
      null,
      2
    );

    const blob = new Blob(
      [dataStr],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "raceData.json";

    link.click();

    URL.revokeObjectURL(url);
  };

  const handleImportData = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = (e) => {

      try {

        const importedData =
          JSON.parse(
            e.target?.result as string
          );

        setRaceData(
          importedData
        );

        localStorage.setItem(
          "raceData",
          JSON.stringify(
            importedData
          )
        );

        alert(
          "データを復元しました"
        );

      } catch {

        alert(
          "JSONファイルの読込に失敗しました"
        );

      }

    };

    reader.readAsText(file);
  };

  return (
    <div className="app-container">
      <button
        className="menu-button"
        onClick={() =>
          setShowMenu(!showMenu)
        }
      >
        ☰
      </button>
      {showMenu && (
        <div className="menu-panel">

          <button
            onClick={() =>
            setMenuPage("progress")
            }
          >
            全国制覇率
          </button>

          <button
            onClick={() =>
              setMenuPage("add")
            }
          >
            大会追加
          </button>

          <button
          onClick={() =>
          setMenuPage("map")
          }
          >
            地図
          </button>

          <button
            onClick={() =>
              setMenuPage("filter")
            }
          >
            フィルタ
          </button>

          <button
            onClick={() =>
              setMenuPage("raceList")
            }
          >
            大会一覧
          </button>

          <button
            onClick={() =>
              setMenuPage("stats")
            }
          >
            統計
          </button>

          <button
            onClick={() =>
              setMenuPage("backup")
            }
          >
            バックアップ
          </button>

        </div>
      )}

      {menuPage === "progress" && (
        <div className="progress-card">
          <h3>🏃 全国制覇率</h3>

          <p>
            {filteredPrefectures.length} / 47
          </p>
          <p>
            {(
              (filteredPrefectures.length / 47) *
              100
            ).toFixed(1)}
            %
          </p>
        </div>
      )}

    {selectedPrefecture &&
        raceData[selectedPrefecture as keyof typeof raceData] && (
          <div className="race-card">
            {editingRace && (
              <div className="edit-race-card">

                <h3>大会編集</h3>

                <input
                  type="text"
                  value={editingRace.race}
                  onChange={(e) =>
                    setEditingRace({
                      ...editingRace,
                      race: e.target.value,
                    })
                  }
                />

                <input
                  type="date"
                  value={editingRace.date}
                  onChange={(e) =>
                    setEditingRace({
                      ...editingRace,
                      date: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  value={editingRace.time}
                  onChange={(e) =>
                    setEditingRace({
                      ...editingRace,
                      time: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  value={editingRace.distance}
                  onChange={(e) =>
                    setEditingRace({
                      ...editingRace,
                      distance: e.target.value,
                    })
                  }
                />
                
                <select
                  value={editingRace.type}
                    onChange={(e) =>
                      setEditingRace({
                        ...editingRace,
                        type: e.target.value,
                      })
                    }
                >
                  <option value="full">
                    フルマラソン
                  </option>

                  <option value="half">
                    ハーフマラソン
                  </option>

                  <option value="trail">
                    トレイルマラソン
                  </option>

                  <option value="other">
                    その他
                  </option>

                </select>

                <button onClick={handleSaveEdit}>
                  保存
                </button>

              </div>
            )}
            <button
              className="close-button"
              onClick={() =>
                setSelectedPrefecture(null)
              }
            >
              ×
            </button>

            <h2>{selectedPrefecture}</h2>

            {raceData[
              selectedPrefecture as keyof typeof raceData
            ].map((race, index) => (
              <div key={index}>
                <p>大会名：{race.race}</p>
                <p>日付：{race.date}</p>
                <p>タイム：{race.time}</p>
                <p>距離：{race.distance}km</p>
                <p>種別：{race.type}</p>

                {race.garminUrl && (
                  <a>
                    href={race.garminUrl}
                    target="_blank"
                  </a>
                )}
                
                <button
                  onClick={() =>
                    setEditingRace({
                      prefecture: selectedPrefecture,
                      index: index,
                      ...race,
                    })
                  }
                >
                  編集
                </button>

                <button
                  onClick={() =>
                    handleDeleteRace(
                      selectedPrefecture,
                      index
                    )
                  }
                  className="delete-button"
                >
                  削除
                </button>

                <hr />
              </div>
            ))}

          </div>
        )}

    {menuPage === "add" && (
      <div className="add-race-card">

        <h3>大会追加</h3>

        <select
          value={newPrefecture}
          onChange={(e) =>
            setNewPrefecture(e.target.value)
          }
        >
          <option value="">
            都道府県選択
          </option>

          {geoData?.features.map(
            (feature: any) => (
              <option
                key={feature.properties.name}
                value={feature.properties.name}
              >
                {feature.properties.name}
              </option>
            )
          )}
        </select>

        <input
          type="text"
          placeholder="大会名"
          value={newRaceName}
          onChange={(e) =>
            setNewRaceName(e.target.value)
          }
        />

        <input
          type="date"
          value={newRaceDate}
          onChange={(e) =>
            setNewRaceDate(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="03:30:00"
          value={newRaceTime}
          onChange={(e) =>
            setNewRaceTime(e.target.value)
          }
        />
        
        <input
          type="text"
          value={newDistance}
          placeholder="距離(km)"
          readOnly
        />

        <select
          value={newRaceType}
          onChange={(e) =>
            setNewRaceType(e.target.value)
          }
        >
          <option value="">
            大会タイプ選択
          </option>

          <option value="full">
            フルマラソン
          </option>

          <option value="half">
            ハーフマラソン
          </option>

          <option value="trail">
            トレイルマラソン
          </option>

          <option value="other">
            その他
          </option>
        </select>
        

        <input
          type="text"
          placeholder="Garmin URL"
          value={newGarminUrl}
          onChange={(e) =>
            setNewGarminUrl(e.target.value)
          }
        />

        <button onClick={handleAddRace}>
          大会追加
        </button>

        <input
          type="file"
          accept=".gpx"
          onChange={handleGpxUpload}
        />
      </div>
    )}

    {menuPage === "filter" && (
      <div className="filter-card">
        <button
          onClick={() => setRaceFilter("all")}
        >
          すべて
        </button>

        <button
          onClick={() => setRaceFilter("full")}
        >
          フル
        </button>

        <button
          onClick={() => setRaceFilter("half")}
        >
          ハーフ
        </button>

        <button
          onClick={() => setRaceFilter("trail")}
        >
          トレイル
        </button>

        <button
          onClick={() => setRaceFilter("other")}
        >
          その他
        </button>
      </div>
    )}

    {menuPage === "raceList" && (
      <div className="race-list-card">
        <h3>大会一覧</h3>
        <select
          value={sortType}
          onChange={(e) =>
            setSortType(e.target.value)
          }
        >
          <option value="date">
            日付順
          </option>
          <option value="time">
            タイム順
          </option>
          <option value="year">
            年別
          </option>
        </select>
        {(() => {

          let currentYear = "";

          return sortedRaces.map(
            (race, index) => {

              const year =
                race.date.substring(0, 4);

              const showYear =
                currentYear !== year;

              currentYear = year;

              return (
                <div key={index}>

                  {showYear && (
                    <h3>
                      {year}年
                    </h3>
                  )}

                  <strong>
                    {race.race}
                  </strong>

                  <br />

                  {race.prefecture}

                  <br />

                  {race.date}

                  <br />

                  {race.time}

                  <hr />

                </div>
              );
            }
          );

        })()}

      </div>
      )}

      {menuPage === "stats" && (

        <div className="stats-card">

          <h3>統計情報</h3>

          <p>
            出走数：
            {raceCount}
          </p>

          <p>
            総距離：
            {totalDistance.toFixed(1)}
            km
          </p>

          <p>
            ベストタイム：
            {
              secondsToTime(
                bestTimeSeconds
              )
            }
          </p>

          {bestRace && (
            <>
              <p>
                ベスト大会：
                {bestRace.race}
              </p>

              <p>
                記録日：
                {bestRace.date}
              </p>
            </>
          )}

          <p>
            平均タイム：
            {
              secondsToTime(
                averageTimeSeconds
              )
            }
          </p>

        </div>

      )}

      {menuPage === "backup" && (

        <div className="backup-card">

          <h3>
            バックアップ
          </h3>

          <button
            onClick={
              handleExportData
            }
          >
            バックアップ保存
          </button>

          <br />
          <br />

          <input
            type="file"
            accept=".json"
            onChange={
              handleImportData
            }
          />

        </div>

      )}

    <MapContainer
      center={[36.2, 138.2]}
      zoom={5}
      style={{ height: "100vh", width: "100%" }}
    >
      
      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {geoData && (
        <GeoJSON
          data={geoData}
          style={(feature) => {
            const prefName = feature?.properties?.name;

            return {
              color: "#333",
              weight: 1,
              fillColor:
                getPrefectureColor(prefName),
              fillOpacity: 0.7,
            };
          }}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(
              feature.properties.name
            );

            layer.on({
              click: () => {
                setSelectedPrefecture(
                  feature.properties.name
                );
              },
            });
          }}
        />
      )}
    </MapContainer>

    <div className="legend-card">

      <h4>凡例</h4>

      {raceFilter === "full" && (
        <>
          <p><span className="legend-red"></span> ～2:59</p>
          <p><span className="legend-orange"></span> ～3:29</p>
          <p><span className="legend-yellow"></span> ～3:59</p>
          <p><span className="legend-green"></span> ～4:29</p>
          <p><span className="legend-blue"></span> 4:30～</p>
        </>
      )}

      {raceFilter === "half" && (
        <>
          <p><span className="legend-red"></span> ～1:29</p>
          <p><span className="legend-orange"></span> ～1:44</p>
          <p><span className="legend-yellow"></span> ～1:59</p>
          <p><span className="legend-green"></span> ～2:29</p>
          <p><span className="legend-blue"></span> 2:30～</p>
        </>
      )}

    </div>

  </div>

  

    
    
  );
}

export default App;