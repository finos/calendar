import { useState } from 'react';
import propTypes from 'prop-types';
import './SearchHeader.css'

const SearchHeader = ({filterEvents})=>{
  const [ searchTerm, setSearchTerm ] = useState('');

  const handleInputTextChange = (e)=>{
    setSearchTerm(e.target.value);
    if(!e.target.value.trim()) filterEvents(false) ;// handles searchbox clear
  };

  const handleSearch = ()=>{
		if(!searchTerm.trim()) return;
    filterEvents(searchTerm);
	};

  const handleEnterPress = (e)=>{
    if(e.key === 'Enter') handleSearch();
  };

  return(
    <div className="search-header">
			<input type='text' placeholder='Search events' value={searchTerm} onChange={handleInputTextChange} onKeyDown={handleEnterPress}/>
			<button onClick={handleSearch}>Search</button>
		</div>
  );
};

SearchHeader.propTypes = {
  filterEvents : propTypes.oneOfType([propTypes.func])
}

export default SearchHeader;