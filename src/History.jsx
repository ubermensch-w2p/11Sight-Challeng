import { useHistory } from "./HistoryProvider";
import { Link } from "react-router-dom";
import './History.css'

function History() {
  const history = useHistory();

  return (
    <>
      <h2>History</h2>

      <ul className="history-list">
        <li>
          <span><strong>Search keyword</strong></span>
          <span><strong>Time</strong></span>
        </li>
        {history.retrieve().map((searchedItem, index) => (
          <li key={index}>
            <Link to={`/search?username=${searchedItem.text}`}>{searchedItem.text}</Link>
            <span>{new Date(searchedItem.timestamp).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default History;