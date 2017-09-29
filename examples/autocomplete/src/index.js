import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';

import { latest, cancel, step } from 'cancelable';

const request = step(onCancel => (url, params) => {
  const source = axios.CancelToken.source();
  onCancel(() => source.cancel());
  return axios.get(url, { params, cancelToken: source.token });
});

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      songs: [],
      value: ''
    };

    this.search = latest(function*(term) {
      this.setState({
        value: term,
        isLoading: true
      });

      const res = yield request('/api/songs', { q: term });

      this.setState({
        isLoading: false,
        songs: res.data
      });
    }, this);
  }

  componentWillUnmount() {
    cancel(this.search);
  }

  render() {
    const { isLoading, songs, value } = this.state;
    const { search } = this;

    return (
      <div className="app">
        <input
          type="text"
          className="input"
          value={value}
          onChange={e => search(e.target.value)}
        />

        {isLoading ? (
          <div>Loading...</div>
        ) : (!songs.length && value) ? (
          <div>No Results</div>
        ) : (
          <ul>
            {}
            {songs.map(({ title, id }) => {
              return <li key={id}>{title}</li>;
            })}
          </ul>
        )}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
