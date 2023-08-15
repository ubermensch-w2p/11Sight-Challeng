import _ from 'lodash'

const LOCAL_STORAGE_ITEM_KEY = 'history';

class SearchItem {
    constructor(text) {
        this.text = text;
        this.timestamp = Date.now();
    }
}

// Maintains a search history for 50 searches by default.
export default class SearchHistory {
    #list;
    constructor(size = 50) {
        // load the search history from local storage if present
        // else create a new array to maintain it.
        const savedHistory = localStorage.getItem(LOCAL_STORAGE_ITEM_KEY);
        if (savedHistory){
            const savedSearchObj = JSON.parse(savedHistory);
            this.#list = savedSearchObj.list;
        }
        else {
            this.#list = new Array(size);
            this.#list.fill(null);
        }
    }

    insert(text) {
        // if the text is already searched previously remove it
        if (!_.remove(this.#list, (searchedItem) => searchedItem && (searchedItem.text == text)).length) {
            this.#list.pop();
        }

        // insert most recent search at the head of the list.
        this.#list.unshift(new SearchItem(text));
        this.#commit();
    }

    retrieve() {
        return this.#list.filter((item) => !!item);
    }

    // As the #list attribute is private, it is not visible to JSON.stringify.
    // This method is called by js as part of JSON.stringify (implicit protocol)
    toJSON(){
        return {list: this.#list};
    }

    // commits the search history to local storage
    #commit(){
        localStorage.setItem(LOCAL_STORAGE_ITEM_KEY, JSON.stringify(this));
    }
}