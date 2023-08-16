import React from "react";
import axios from "axios";
import { useSearchParams } from 'react-router-dom'
import { useHistory } from "./HistoryProvider"
import './Search.css'
import _ from 'lodash'
import useInViewPort from './CustomHooks'

const GITHUB_USERS_API_ROOT = 'https://api.github.com/users/';
const REPOS_PAGE_SIZE = 10;

const SET_USER_DATA = 'SET_USER_DATA';
const NO_USER = 'NO_USER';
const USER_NOT_FOUND = 'USER_NOT_FOUND';
const NEXT_REPOS_PAGE = 'NEXT_REPOS_PAGE';
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
    let repos = [];
    let reposPageNo = 0;

    const userProfile = await axios.get(`${GITHUB_USERS_API_ROOT}${username}`, RequestConfig);
    const { avatar_url, name, email, bio, public_repos } = userProfile.data;

    if (public_repos) {
      // fetch 1st page of user's public repos
      const userReposPage1 = await fetchUserRepos(username, 1);
      repos = userReposPage1.data;
      reposPageNo++;
    }

    const userData = { username, avatar_url, name, email, bio, public_repos, repos, reposPageNo };
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

async function fetchUserRepos(username, repoPageNo, dispatchUser = Function.prototype, pageSize = REPOS_PAGE_SIZE) {
  try {
    const userRepos = await axios.get(
      `${GITHUB_USERS_API_ROOT}${username}/repos?per_page=${pageSize}&page=${repoPageNo}`,
      RequestConfig
    );

    dispatchUser({ type: NEXT_REPOS_PAGE, payload: userRepos.data });

    return userRepos;
  }
  catch (error) {
    console.log(error);
  }
}

function userDataReducer(state, action) {
  switch (action.type) {
    case SET_USER_DATA:
      return { isLoading: false, error: false, found: true, data: action.payload };

    case NO_USER:
      return null;

    case USER_NOT_FOUND:
      return { isLoading: false, error: false, found: false, data: null }

    case NEXT_REPOS_PAGE: {
      const repos = state.data.repos.concat(action.payload);
      return {
        ...state,
        data: {
          ...state.data,
          reposPageNo: state.data.reposPageNo + 1,
          repos
        }
      }
    }

    case LOADING:
      return { isLoading: true, error: false, found: null, data: null };

    case ERROR:
      return { isLoading: false, error: true, found: null, data: null };

    default:
      throw Error('Not implemented');
  }
}

function Search() {
  const [user, dispatchUser] = React.useReducer(userDataReducer, null);
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
      dispatchUser({ type: NO_USER });
    }
  }

  // handles paginated fetch of user repos.
  function handleLoadMoreRepos() {
    if (user.data.public_repos > user.data.repos.length) {
      fetchUserRepos(user.data.username, user.data.reposPageNo + 1, dispatchUser);
    }
  }

  return (
    <>
      <h2>Search</h2>
      <SearchForm onSearch={handleSearch} />
      {user && (<UserDetailsWithEdgeCasesHandled user={user} onLoadMoreRepos={handleLoadMoreRepos} />)}
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
      <Component user={user} {...rest} />
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
      <Component user={user} {...rest} />
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
      <Component user={user} {...rest} />
    );
  }
}

// Base Component to display the details of GitHub User
function UserDetails({ user, onLoadMoreRepos }) {
  // ref to target HTML element which needs to be monitored for visibility intersection
  const refTargetHTMLElement = useInViewPort(onLoadMoreRepos);

  return user.data ? (
    <div className="user">
      <article className="card">
        <img style={{ width: '100%' }} src={user.data.avatar_url} alt={`Avatar image for ${user.data.name}`} />
        <div className="container">
          <p><strong>Name:</strong> {user.data.name}</p>
          <p><strong>Email:</strong> {user.data.email}</p>
          <p><strong>Bio:</strong> {user.data.bio}</p>
          <p><strong>Public Repos:</strong> {user.data.public_repos}</p>
        </div>
      </article>

      <div className="user-repos">
        <h3>List of public repos:</h3>
        <ol>
          {user.data.repos.map((repo, index) => (
            <li key={index}>
              <a href={repo.html_url}>{repo.name}</a>
              <p>{repo.description}</p>
            </li>
          ))}
        </ol>
      </div>
      {user.data.public_repos > user.data.repos.length ?
        (<button ref={refTargetHTMLElement} type="button" onClick={onLoadMoreRepos}>More Repos</button>) : null}
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