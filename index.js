const request = require("request");
const fs = require("fs");
const async = require("async");

function login(username, password) {

  return new Promise((resolve, reject) => {

    request.post({
      url: "https://api.taiga.io/api/v1/auth",
      json: true,
      body: {
        username,
        password,
        type: "normal"
      }
    }, (error, response, body) => {

      if (error) {
        return reject(error);
      }

      if (response.statusCode === 200) {
        return resolve(body);
      } else {
        return reject(body);
      }

    });

  });

}

function createUserStory(token, project, subject, description) {

  return new Promise((resolve, reject) => {

    request.post({
      url: "https://api.taiga.io/api/v1/userstories",
      json: true,
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: {
        project,
        subject,
        description
      }
    }, (error, response, body) => {

      if (error) {
        return reject(error);
      }

      if (response.statusCode === 201) {
        return resolve(body);
      } else {
        return reject(body);
      }

    });

  });

}

function readUserStoriesFromFile(file) {

  const content = fs.readFileSync(file).toString("utf8");
  const lines = content.split("\n");

  let uss = [];
  let us = null;
  for (let line of lines) {

    if (line.substr(0,3) === "## ") {

      const subject = line.substr(3);

      if (us !== null) {
        uss.push({
          subject: us.subject,
          description: us.description
        });
      }

      us = { subject, description: "" };

    } else {

      if (us !== null) {
        us.description += line + "\n";
      }

    }

  }

  uss.push({
    subject: us.subject,
    description: us.description
  });

  return uss;

}

console.log(`Using \x1B[0;32m ${process.argv[2]} ${process.argv[3]}\x1B[0m`);
login(process.argv[2], process.argv[3]).then((auth) => {

  const uss = readUserStoriesFromFile("uss.md");
  async.mapSeries(uss, (userStory, next) => {

    console.log(`\x1B[0;35m${userStory.subject}\x1B[0m\n`);
    console.log(`${userStory.description}\n`);

    createUserStory(auth.auth_token, 133522, userStory.subject, userStory.description).then((body) => {
      return next(null, body);
    }).catch((error) => {
      return next(error);
    });

  }, (error, results) => {

    if (error) {
      console.error(`\x1B[0;31m${error}\x1B[0m`);
    } else {
      for (let result of results) {
        console.log(`\x1B[0;32m${result.id}\x1B[0m`);
      }
    }

  });

});
