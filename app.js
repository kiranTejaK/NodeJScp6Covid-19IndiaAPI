const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
//Helper Functions

const convertStateObj = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const districtObj = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//GET States Population
module.exports = app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesList = await database.all(getStatesQuery);
  let result = statesList.map(convertStateObj);
  response.send(result);
});

//GET one specific State
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const statePopulation = await database.get(getStateQuery);
  response.send(convertStateObj(statePopulation));
});
//post disticts
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO
      district ( district_name,state_id,cases,cured,active,deaths )
    VALUES(
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
    );`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});
//GET district details
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistQuery = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`;
  const districtDetails = await database.get(getDistQuery);
  response.send(districtObj(districtDetails));
});
//DELETE district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictquery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`;
  await database.run(deleteDistrictquery);
  response.send("District Removed");
});
//UPDATE district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistQuery = `
    UPDATE
      district
    SET
      district_name ='${districtName}',
      state_id ='${stateId}',
      cases='${cases}',
      cured='${cured}',
      active='${active}',
      deaths='${deaths}'
      `;
  await database.run(updateDistQuery);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
