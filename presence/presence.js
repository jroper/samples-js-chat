/*
 * Copyright 2019 Lightbend Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


const crdt = require("cloudstate").crdt;

const entity = new crdt.Crdt(
  "presence.proto",
  "cloudstate.samples.chat.presence.Presence"
);

entity.defaultValue = () => new crdt.Vote();

entity.onStateSet = state => {
  state.users = 0;
  // Enrich the state with callbacks for users connected
  state.connect = () => {
    state.users += 1;
    if (state.users === 1) {
      state.vote = true;
    }
  };
  state.disconnect = () => {
    state.users -= 1;
    if (state.users === 0) {
      state.vote = false;
    }
  };
};

function connect(user, ctx) {
  ctx.onStreamCancel = state => {
    state.disconnect();
  };
  ctx.state.connect();
}

function monitor(user, ctx) {
  let online = ctx.state.atLeastOne;
  ctx.onStateChange = state => {
    if (online !== state.atLeastOne) {
      online = state.atLeastOne;
      return {online};
    }
  };
  return {online};
}

entity.commandHandlers = {
  Connect: connect,
  Monitor: monitor
};

module.exports = entity;
