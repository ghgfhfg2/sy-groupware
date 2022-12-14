import React, { useState, useEffect } from "react";
import { db } from "src/firebase";
import { ref, get, onValue } from "firebase/database";
import useGetUser from "@component/hooks/getUserDb";
import styled from "styled-components";
import { Button } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import InsaSkeleton from "@component/insa/InsaSkeleton";
import UserModifyPop from "@component/insa/UserModifyPop";
import { format } from "date-fns";
import { RiArrowUpDownFill } from "react-icons/ri";
import { AiOutlineSetting } from "react-icons/ai";
import UserDayoffPop from "./UserDayoffPop";

export const ListUl = styled.div`
  position:relative;
  display: flex;
  flex-direction: column;
  > ul {
    display: flex;
  }
  .link {
    cursor: pointer;
    &:hover {
      font-weight: bold;
    }
  }
  .header {
    height: 55px;
    background: var(--p-color);
    color: #fff;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
  }
  .body {
    flex-direction: column;
    > li {
      display: flex;
      align-items: center;
    }
    .box {
      height: 50px;
      border-bottom: 1px solid #eaeaea;
      &.dayoff{display:flex;justify-content: flex-end;
        button{margin-left:10px}
      }
    }
  }
  .box {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    &.dayoff{flex:0 0 90px}
  }
  @media screen and (max-width:1024px) {
    overflow:auto;
    padding-bottom:15px;
  }
`;

export default function UserList() {
  const getUserInfo = useGetUser();
  const partList = getUserInfo[1]?.partList;
  const rankList = getUserInfo[1]?.rankList;

  const [userData, setUserData] = useState();
  const userInfo = useSelector((state) => state.user.currentUser);
  let userAll = useSelector((state) => state.user.allUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isModifyPop, setIsModifyPop] = useState(false);

  const onUserModify = async (uid) => {
    const dbRef = ref(db, `user/${uid}`);
    const getUser = await get(dbRef);
    let user = {
      ...getUser.val(),
    };
    setUserData(user);
    setIsModifyPop(true);
  };
  const closeUserModify = () => {
    setUserData("");
    setIsModifyPop(false);
  };

  const [adminCheck, setAdminCheck] = useState(false);
  const [userAllState, setUserAllState] = useState();
  const [managerList, setManagerList] = useState();

  const [render, setRender] = useState(false);
  const onRender = () => {
    setRender(!render);
  };

  useEffect(() => {
    if (userAll) {
      let userAllArr;
      userAllArr = userAll.map((el) => {
        let user = userAll.find((li) => {
          return el.manager_uid === li.uid;
        });
        if (user) {
          el.manager_uid = user;
        }
        return el;
      });
      setUserAllState(userAll);
      if (userInfo?.authority && userInfo.authority.includes("admin")) {
        setAdminCheck(true);
      }
      setIsLoading(true);

      let managerArr = [];
      userAll.map((el) => {
        if (el.manager == "1") {
          managerArr.push(el);
        }
      });
      setManagerList(managerArr);
    }
  }, [userAll, userInfo, render]);

  const [sortState, setSortState] = useState();
  const onSort = (type) => {
    let sortObj = {
      type,
      sort: "asc",
    };
    if (sortState?.sort === "asc") {
      sortObj.sort = "desc";
    } else if (sortState?.sort === "desc") {
      sortObj.sort = "asc";
    }
    setSortState(sortObj);
    userAll = userAll.sort((a, b) => {
      if (sortObj.sort === "asc") {
        return a[type] - b[type];
      } else {
        return b[type] - a[type];
      }
    });
    setUserAllState(userAll);
  };


  //???????????? 
  const [isDayoffPop, setIsDayoffPop] = useState(false)
  const onDayoffPop = async (uid) => {
    const dbRef = ref(db, `user/${uid}`);
    const getUser = await get(dbRef);
    let user = {
      ...getUser.val(),
    };
    setUserData(user);
    setIsDayoffPop(true)
  }
  const closeDayoffPop = () => {
    setUserData('')
    setIsDayoffPop(false)
  }

  return (
    <>
      {isLoading ? (
        <>
          <ListUl>
            <ul className="header" style={{minWidth:"1000px"}}>
              <li className="box name">??????</li>
              <li className="box part">??????</li>
              <li className="box rank">??????</li>
              <li className="box call">????????????</li>
              <li className="box call">????????????2</li>
              <li className="box manager">?????????</li>
              <li className="box email">?????????</li>
              <li className="box date">
                ?????????
                <button>
                  <RiArrowUpDownFill
                    onClick={() => {
                      onSort("timestamp");
                    }}
                    style={{ marginLeft: "5px", fontSize: "1.1rem" }}
                  />
                </button>
              </li>
              {adminCheck && (
                <>
                  <li className="box dayoff">????????????</li>
                  <li className="box setting"></li>
                </>
              )}
            </ul>
            <ul className="body" style={{minWidth:"1000px"}}>
              {userAllState &&
                userAllState.map((el) => (
                  <>
                    <li key={el.uid}>
                      <span className="box name">{el.name}</span>
                      <span className="box part">{el.part}</span>
                      <span className="box rank">{el.rank}</span>
                      <span className="box call">{el.call}</span>
                      <span className="box call">{el.call2}</span>
                      <span className="box manager">
                        {el.manager_uid && (
                          <>
                            {el.manager_uid.name} ({el.manager_uid.rank})
                          </>
                        )}
                      </span>
                      <span className="box email">{el.email}</span>
                      <span className="box date">
                        {el.date && format(new Date(el.date), "yyyy-MM-dd")}
                      </span>
                      {adminCheck && (
                        <>
                          <span className="box dayoff">
                            {el.dayoff ? `${el.dayoff}???` : ""}
                            <Button size="sm" variant='outline' colorScheme="teal" onClick={()=>{onDayoffPop(el.uid)}}><AiOutlineSetting /></Button>
                          </span>
                          <div className="box setting">
                            <Button
                              size="sm"
                              onClick={() => {
                                onUserModify(el.uid);
                              }}
                            >
                              ??????
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  </>
                ))}
            </ul>
          </ListUl>
          {userData && isModifyPop && (
            <UserModifyPop
              managerList={managerList}
              userData={userData}
              partList={partList}
              rankList={rankList}
              onRender={onRender}
              closeUserModify={closeUserModify}
            />
          )}
          {userData && isDayoffPop && (
            <UserDayoffPop
              userData={userData}
              onRender={onRender}
              closeDayoffPop={closeDayoffPop}
          />
          )}
        </>
      ) : (
        <>
          <InsaSkeleton />
        </>
      )}
    </>
  );
}
