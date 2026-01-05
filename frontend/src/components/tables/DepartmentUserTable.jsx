import React from "react";
import {ShimmerButton, ShimmerTable} from "react-shimmer-effects";
import {useNavigate} from "react-router-dom";

const DepartmentUserTable = ({ users, loading }) => {
  const navigate = useNavigate();
  
  return (
    <>
      {loading ?
        <div className="department-buttons-container">
          <ShimmerButton size="lg"/>
        </div> : (
        <div className="department-buttons-container">
          <button onClick={() => navigate('/user/users')} type="button" name="dep-user">
            Add A User
          </button>
        </div>
      )}

      {loading ? <ShimmerTable row={5} col={3} /> : (
        <div className="table-container sticky">
          <table>
            <thead className="stick-header dep-user-thead">
              <tr>
                <th>Fullname</th>
                <th>Course</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((depU) => {
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

                      <td>
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