import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FormErrorMessage,
  FormControl,
  Input,
  Button,
  Flex,
  FormLabel,
  Stack,
  Box,
  useRadioGroup,
  useToast,
  Checkbox,
} from "@chakra-ui/react";

import { db } from "src/firebase";
import {
  ref,
  set,
  update,
  onValue,
  off,
  query,
  orderByChild,
} from "firebase/database";
import { format, getMonth, getDate } from "date-fns";
import styled from "styled-components";
import shortid from "shortid";
import ko from "date-fns/locale/ko";
import { CommonForm } from "pages/setting";
const Editor = dynamic(() => import("@component/board/Editor"), {
  ssr: false,
});
import Link from "next/link";
import ManagerListPop from "@component/board/ManagerListPop";
import useGetUser from "@component/hooks/getUserDb";
import { basicForm } from "@component/BasicForm";

export default function TypeBoard() {
  useGetUser();
  const toast = useToast();
  const userInfo = useSelector((state) => state.user.currentUser);
  const userAll = useSelector((state) => state.user.allUser);
  const router = useRouter();
  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const watchRadio = watch("type");
  const watchTitle = watch("title");
  const [editorState, setEditorState] = useState(basicForm);

  const [initTypeCon, setInitTypeCon] = useState();
  useEffect(() => {
    const typeRef = query(ref(db, `board/type_list/${router.query.id}`));
    onValue(typeRef, (data) => {
      if (data.val()?.title) {
        setValue("title", data.val().title);
      }
      setInitTypeCon(data.val());
    });
    return () => {
      off(typeRef);
    };
  }, []);

  const handleEditor = (value) => {
    setEditorState(value);
  };
  const onSubmit = (values) => {
    
    let editCon = initTypeCon?.editor || editorState;
    return new Promise((resolve) => {
      let uid = router.query.id || shortid.generate();
      let obj = {
        ...values,
        editor: editCon,
        timestamp: new Date().getTime(),
        writer_uid: userInfo.uid,
        manager: checkManagerList || "",
        uid,
      };
      const typeRef = ref(db, `board/type_list/${uid}`);
      update(typeRef, {
        ...obj,
      }).then(() => {
        toast({
          description: "?????????????????????.",
          status: "success",
          duration: 1000,
          isClosable: false,
        });
        router.push("/setting/type_board");
      });
      resolve();
    });
  };


  // ????????? ??????
  const [managerList, setManagerList] = useState();
  const [checkManagerList, setCheckManagerList] = useState();
  useEffect(() => {
    if (userAll) {
      let list = userAll.filter((el) => el.manager === 1);
      setManagerList(list);
    }
  }, [userAll]);

  const [isManagerPop, setIsManagerPop] = useState(false);
  const onManagerPop = () => {
    if (checkManagerList) {
      toast({
        description: "?????? ??????????????? ??????????????? ????????????.",
        status: "error",
        duration: 1000,
        isClosable: false,
      });
    } else {
      setIsManagerPop(true);
    }
  };
  const closeManagerPop = () => {
    setIsManagerPop(false);
  };
  const onSelectManager = (checkedItems) => {
    let newList = checkedItems.sort((a, b) => {
      return a.value - b.value;
    });
    setCheckManagerList(newList);
    onManager(newList);
    closeManagerPop();
  };
  const [editorDisable, setEditorDisable] = useState(false);
  const [insertHtml, setInsertHtml] = useState();

  const onManager = (managerList) => {

    const editor = initTypeCon?.editor || editorState;
    let newEditor = clearManager(editor, managerList);
    managerList.forEach((el, idx) => {
      let pos = newEditor.indexOf(`<!-- add_start_${idx + 1} -->`);
      newEditor = [
        newEditor.slice(0, pos + 37),
        el.name,
        newEditor.slice(pos + 37),
      ].join("");
    });
    setEditorDisable(true);
    setInsertHtml(newEditor);
    setEditorState(newEditor);
  };
  const offManager = () => {
    let newEditor = clearManager(editorState, managerList);
    setInsertHtml(newEditor);
    setEditorState(newEditor);
    setEditorDisable(false);
    setCheckManagerList("");
  };

  const clearManager = (editorState, managerList) => {
    let newEditor = editorState;
    managerList.forEach((el, idx) => {
      let start = newEditor.indexOf(`<!-- add_start_${idx + 1} -->`);
      let end = newEditor.indexOf(`<!-- add_end_${idx + 1} -->`);
      newEditor = [newEditor.slice(0, start + 37), newEditor.slice(end)].join(
        ""
      );
    });
    return newEditor;
  };

  const onEditor = () => {
    if (editorDisable) {
      toast({
        description: "????????? ????????? ????????? ????????? ??? ????????????.",
        status: "info",
        duration: 1000,
        isClosable: false,
      });
    }
  };

  return (
    <>
    {isManagerPop && managerList && (
        <ManagerListPop
          userData={managerList}
          closeManagerPop={closeManagerPop}
          onSelectManager={onSelectManager}
          isManagerPop={isManagerPop}
        />
      )}
    <CommonForm style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
      <Flex>
        <Flex width="100%" flexDirection="column" gap={5}>
          <FormControl isInvalid={errors.title}>
            <div className="row_box">
              <FormLabel className="label" htmlFor="title">
                * ?????????
              </FormLabel>
              <Input
                id="title"
                className="sm"
                {...register("title", {
                  required: "???????????? ???????????? ?????????.",
                })}
              />
            </div>
            <FormErrorMessage>
              {errors.title && errors.title.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={errors.date}>
            {initTypeCon && initTypeCon.date ? (
              <>
                <Checkbox
                  colorScheme="teal"
                  defaultChecked
                  {...register("date")}
                >
                  ????????????
                </Checkbox>
              </>
            ) : (
              <Checkbox colorScheme="teal" {...register("date")}>
                ????????????
              </Checkbox>
            )}
            <FormErrorMessage>
              {errors.date && errors.date.message}
            </FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={errors.price}>
            {initTypeCon && initTypeCon.price ? (
              <>
                <Checkbox
                  colorScheme="teal"
                  defaultChecked
                  {...register("price")}
                >
                  ??????(??????/??????)
                </Checkbox>
              </>
            ) : (
              <Checkbox colorScheme="teal" {...register("price")}>
                ??????(??????/??????)
              </Checkbox>
            )}
            <FormErrorMessage>
              {errors.price && errors.price.message}
            </FormErrorMessage>
          </FormControl>          
          <div onClick={onEditor}>
          {initTypeCon && initTypeCon.editor ? (
            <>
              <Editor
                initTypeCon={initTypeCon.editor}
                handleEditor={handleEditor}
                disable={editorDisable}
                insertHtml={insertHtml}
              />
            </>
          ) : (
            <Editor 
              handleEditor={handleEditor} 
              disable={editorDisable}
              insertHtml={insertHtml} 
            />
          )}
          </div>
          <FormControl isInvalid={errors.manager}>
            <div className="row_box">
              <FormLabel className="label" htmlFor="manager">
                ?????????
              </FormLabel>
              <Input
                type="text"
                className="sm"
                value={
                  checkManagerList &&
                  checkManagerList.map((el) => el.name)
                }
                readOnly
              />
              <div className="manager_sel_btn_box">
                <Button colorScheme="teal" onClick={onManagerPop} ml={2}>
                  ????????? ??????
                </Button>
                <Button colorScheme="red" onClick={offManager} ml={2}>
                  ????????????
                </Button>
              </div>
            </div>
            <FormErrorMessage>
              {errors.manager && errors.manager.message}
            </FormErrorMessage>
          </FormControl>

          <Flex mt={4} width="100%" justifyContent="center">
            <Button
              width="150px"
              size="lg"
              colorScheme="teal"
              isLoading={isSubmitting}
              type="submit"
            >
              ??????
            </Button>
            <Link href="/setting/type_board">
              <Button width="150px" size="lg" colorScheme="teal" ml={2}>
                ??????
              </Button>
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </CommonForm>
    </>
  );
}
