import React, { useMemo, useState } from "react";
import {ShimmerButton, ShimmerTable} from "react-shimmer-effects";
import {useNavigate} from "react-router-dom";
import useSortableTable from "../../hooks/useSortableTable";

const DepartmentUserTable = ({ users, loading }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState('');

  const filteredData = useMemo(() => {
    return users.filter(item => {
      // User filter - search across firstname, lastname, and middlename
      const matchesUser = user
        ? (item.lastname?.toLowerCase().includes(user.toLowerCase()) ||
           item.firstname?.toLowerCase().includes(user.toLowerCase()) ||
           item.middlename?.toLowerCase().includes(user.toLowerCase()))
        : true;

      return matchesUser;
    });
  }, [users, user]);

  const { 
    sortedData, 
    sortColumn, 
    sortDirection, 
    hoveredColumn, 
    setHoveredColumn, 
    handleSort,
    resetSort
  } = useSortableTable(filteredData);
  
  return (
    <>
      {loading 
        ? <div className="department-buttons-filter-container">
            <div className="left">
              <ShimmerButton size="lg"/>
            </div>
            <div className="right">
              <ShimmerButton size="lg"/>
              <ShimmerButton size="lg"/>
            </div>
          </div> 
        : <div className="department-buttons-filter-container">
            <div className="left">
              <div className="slider-button">
                <button
                  type="button"
                  onClick={() => navigate('/user/users')}
                  name="dep-user"
                >
                  <span className="material-symbols-outlined">
                    add
                  </span>
                  <div className="slide-info">
                    Add New User
                  </div>
                </button>
                
              </div>
            </div>

            <div className="right">
              <div>
                <input 
                  placeholder='Enter User' 
                  name='dep-user'
                  type="text" 
                  value={user} 
                  onChange={(e) => setUser(e.target.value)} 
                  />
              </div>

              <div className="slider-button">
                <button 
                  onClick={() => {
                    setUser('');
                    resetSort();
                  }} 
                  type="button"
                  name="dep-user"
                  >
                    <span className="material-symbols-outlined">
                      reset_settings
                    </span>
                    <div className="slide-info">
                      Reset Filter
                    </div>
                </button>
              </div>
            </div>
          </div>
      }

      <div className={`count-div ${user !== '' ? 'active' : ''}`}>
        <h4>Total Users Found: <span>{sortedData.length}</span></h4>
      </div>

      {loading ? <ShimmerTable row={5} col={3} /> : (
        <div className="table-container sticky">
          <table>
            <thead className="stick-header dep-user-thead">
              <tr>
                <th
                  onMouseEnter={() => setHoveredColumn('lastname')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('lastname')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Fullname</span>
                      <div className={`filter-arrow ${sortColumn === 'lastname' ? 'active' : ''}`}>
                        {(hoveredColumn === 'lastname' || sortColumn === 'lastname') && ( 
                          <span> 
                            {sortColumn === 'lastname' ? sortDirection === 'asc' 
                            ? <span className="material-symbols-outlined">
                                arrow_upward
                              </span> 
                            : <span className="material-symbols-outlined">
                                arrow_downward
                              </span>
                            : <span className="material-symbols-outlined">
                                filter_alt
                              </span> 
                            } 
                          </span> 
                        )}
                      </div>
                    </div>
                  </th>
                <th
                  onMouseEnter={() => setHoveredColumn('course_abb')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('course_abb')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Course</span>
                      <div className={`filter-arrow ${sortColumn === 'course_abb' ? 'active' : ''}`}>
                        {(hoveredColumn === 'course_abb' || sortColumn === 'course_abb') && ( 
                          <span> 
                            {sortColumn === 'course_abb' ? sortDirection === 'asc' 
                            ? <span className="material-symbols-outlined">
                                arrow_upward
                              </span> 
                            : <span className="material-symbols-outlined">
                                arrow_downward
                              </span>
                            : <span className="material-symbols-outlined">
                                filter_alt
                              </span> 
                            } 
                          </span> 
                        )}
                      </div>
                    </div>
                </th>
                <th className="action-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((depU) => {
                  return (
                    <tr key={depU.id}>
                      <td>
                        {depU.lastname},&nbsp;
                        {depU.firstname}&nbsp;
                        {depU.middlename ? depU.middlename + "." : ""}&nbsp;
                        {depU.extension ? depU.extension.toUpperCase() : ""}
                      </td>

                      <td>
                        {depU.course_abb ? depU.course_abb : "N/A"}
                      </td>

                      <td className="action-column">
                        <button onClick={() => navigate(`/user/users/${depU.id}`)}>
                          <span className="material-symbols-outlined view-icon">visibility</span>
                          <span className="tooltip">View User</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3}>No users in this department...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default DepartmentUserTable;