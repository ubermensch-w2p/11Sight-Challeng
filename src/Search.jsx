import React from "react";
import axios from "axios";
import { useSearchParams } from 'react-router-dom'
import { useHistory } from "./HistoryProvider";
import './Search.css'
import _ from 'lodash'

const GITHUB_USERS_API_ROOT = 'https://api.github.com/users/';

const SET_USER_DATA = 'SET_USER_DATA';
const USER_NOT_FOUND = 'USER_NOT_FOUND';
const LOADING = 'LOADING';
const ERROR = 'ERROR';

const RequestConfig = {
  headers: {
    Accept: "application/vnd.github+json",
  },
  // Direct axios to fulfill promise only when this call returns affirmative.
  validateStatus: function (status) {
    return status == 200;
  }
};

async function fetchUser(username, dispatchUser) {
  dispatchUser({ type: LOADING });

  try {
    const [userProfile, userRepos] = await Promise.all([
      axios.get(`${GITHUB_USERS_API_ROOT}${username}`, RequestConfig),
      axios.get(`${GITHUB_USERS_API_ROOT}${username}/repos`, RequestConfig),
    ]);

    const { avatar_url, name, email, bio } = userProfile.data;
    const userData = { avatar_url, name, email, bio, repos: userRepos.data };
    dispatchUser({ type: SET_USER_DATA, payload: userData });
  }
  catch (error) {
    console.log(error);
    if (error?.response?.status == 404) {
      dispatchUser({ type: USER_NOT_FOUND });
    }
    else {
      dispatchUser({ type: ERROR });
    }
  }
}

function userDataReducer(state, action) {
  switch (action.type) {
    case SET_USER_DATA:
      return { isLoading: false, error: false, found: true, data: action.payload };

    case USER_NOT_FOUND:
      return { isLoading: false, error: false, found: false, data: null }

    case LOADING:
      return { isLoading: true, error: false, found: null, data: null };

    case ERROR:
      return { isLoading: false, error: true, found: null, data: null };

    default:
      throw Error('Not implemented');
  }
}

function Search() {
  const [user, dispatchUser] = React.useReducer(userDataReducer, { isLoading: false, error: false, data: null });
  const history = useHistory();

  function handleSearch(searchText) {
    if (searchText.length) {
      // add currently searched item to search history
      history.insert(searchText);
      // network call to github for user details
      fetchUser(searchText, dispatchUser);
    }
    else {
      // when searchText is empty, reset the previous user's data.
      dispatchUser({ type: SET_USER_DATA, payload: null });
    }
  }

  return (
    <>
      <h2>Search</h2>
      <SearchForm onSearch={handleSearch} />
      <UserDetailsWithEdgeCasesHandled user={user} />
    </>
  );
}

function SearchForm({ onSearch }) {
  const refInput = React.useRef();
  // gets/sets URL query string
  const [searchParam, setSearchParam] = useSearchParams();

  function handleSearch(event) {
    // set URL query string to searched username
    setSearchParam({ username: refInput.current.value });
    // prevent reload on form submit
    event.preventDefault();
  }

  // when the URL query string changes, trigger network call to github api through onSearch
  React.useEffect(() => {
    refInput.current.value = searchParam.get('username');
    onSearch(refInput.current.value);
  }, [searchParam.get('username')]);

  return (
    <form onSubmit={handleSearch}>
      <input ref={refInput} type="text" id="search" placeholder="Enter GitHub Username" />
      <button type="submit" >Search</button>
    </form>
  );
}

// A HOC to display when GitHub user is not found
function withUserNotFoundFeedback(Component) {
  return function ({ user, ...rest }) {
    if (user.found == false) {
      return (
        <p>No such user on GitHub!</p>
      );
    }

    return (
      <Component user={user} {...rest}/>
    );
  }
}

// A HOC to display when GitHub user API fails
function withErrorFeedback(Component) {
  return function ({ user, ...rest }) {
    if (user.error) {
      return (
        <p>An error occurred</p>
      );
    }

    return (
      <Component user={user} {...rest}/>
    );
  }
}

// A HOC to display when GitHub API call is underway
function withLoadingFeedback(Component) {
  return function ({ user, ...rest }) {
    if (user.isLoading) {
      return (
        <p>Loading...</p>
      );
    }

    return (
      <Component user={user} {...rest}/>
    );
  }
}

// Base Component to display the details of GitHub User
function UserDetails({ user }) {
  return user.data ? (
    <div className="user">
      <article className="card">
        <img style={{ width: '100%' }} src={user.data.avatar_url} alt={`Avatar image for ${user.data.name}`} />
        <div className="container">
          <p><strong>Name:</strong> {user.data.name}</p>
          <p><strong>Email:</strong> {user.data.email}</p>
          <p><strong>Bio:</strong> {user.data.bio}</p>
        </div>
      </article>

      <div className="user-repos">
        <h3>List of public repos:</h3>
        <ul>
          {user.data.repos.map((repo, index) => (
            <li key={index}>
              <a href={repo.html_url}>{repo.name}</a>
              <p>{repo.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;
}

// HOC composition
const UserDetailsWithEdgeCasesHandled = _.flowRight(
  withErrorFeedback,
  withLoadingFeedback,
  withUserNotFoundFeedback,
)(UserDetails);

export default Search;