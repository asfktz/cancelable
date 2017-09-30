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

      try {
        const res = yield request('/api/songs', { q: term });
        this.setState({
          isLoading: false,
          songs: res.data
        });

      } catch (err) {
        this.setState({
          isLoading: false,
          songs: [],
          hasError: true
        });
      }
    }, this);
  }

  componentWillUnmount() {
    cancel(this.search);
  }

  render() {
    const { isLoading, hasError, songs, value } = this.state;
    const { search } = this;

    console.log(this.state);
    return (
      <div className="app">
        <input
          type="text"
          className="input"
          value={value}
          onChange={e => search(e.target.value)}
        />
        {(() => {
          if (hasError) {
            return <div>Woops, we got an error.</div>;
          }

          if (isLoading) {
            return <div>Loading...</div>;
          }

          if (!songs.length && value !== '') {
            return <div>No Results</div>;
          }

          return (
            <ul>
              {songs.map(({ title, id }) => {
                return <li key={id}>{title}</li>;
              })}
            </ul>
          );
        })()}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
