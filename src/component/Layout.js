import { Flex } from "@chakra-ui/react";
import React from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import LeftMenu from "./LeftMenu";
import Loading from "./Loading";
import Footer from "./Footer";

function Layout({ children }) {
  const userInfo = useSelector((state) => state.user.currentUser);
  const logoUrl = useSelector((state) => state.logo.url);
  return (
    <>
      <div className="wrapper">
        <Header logoImg={logoUrl} />
        <div className="container">
          <LeftMenu userInfo={userInfo} />
          <div className="content_box">
            {children ? (
              <main>{children}</main>
            ) : (
              <Flex justifyContent="center" alignItems="center">
                <Loading />
              </Flex>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default Layout;
