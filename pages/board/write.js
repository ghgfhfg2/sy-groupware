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
  NumberInput,
  useToast,
} from "@chakra-ui/react";

import { AiOutlinePlus, AiOutlineDelete } from "react-icons/ai";
import { db } from "src/firebase";
import { ref, set, get, onValue, off } from "firebase/database";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { format, getYear, getMonth, getDate } from "date-fns";
import styled from "styled-components";
import shortid from "shortid";
import ko from "date-fns/locale/ko";
import { CommonForm } from "pages/setting";
// import Editor from "@component/board/Editor";
import ComRadio from "@component/ComRadio";
import ManagerListPop from "@component/board/ManagerListPop";
import UploadBox from "@component/UploadBox";
import useGetUser from "@component/hooks/getUserDb";
import { numberToKorean } from "@component/CommonFunc";


const BoardWrite = styled(CommonForm)`
  .row_box {
    .price {
      margin-left: 5px;
      color: #858585;
    }
  }
`;

const Editor = dynamic(() => import("@component/board/Editor"), {
  ssr: false,
});

export default function Write() {
  useGetUser();
  const storage = getStorage();
  const toast = useToast();
  const userAll = useSelector((state) => state.user.allUser);
  const userInfo = useSelector((state) => state.user.currentUser);
  const router = useRouter();
  const incomeRef = useRef();
  const spendRef = useRef();
  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const watchRadio = watch("type");
  const watchPrice = watch(["income", "spend"]);

  const [editorState, setEditorState] = useState();
  const handleEditor = (value) => {
    setEditorState(value);
  };

  const onSubmit = async (values) => {
    if (writeOption.price) {
      if (!values.income && !values.spend) {
        toast({
          description: "?????? ?????? ??????????????? ????????? ?????????.",
          status: "error",
          duration: 1000,
          isClosable: false,
        });
      }
    }
    const uid = shortid.generate();
    const CurDate = new Date();
    let imgUrl;
    const imgPromise = uploadList.map(async (el) => {
      const storageRef = sRef(
        storage,
        `board/list/${format(new Date(values.date), "yyyyMMdd")}${uid}/${shortid.generate()}`
      );
      const url = await uploadBytes(storageRef, el).then((snapshot) => {
        const downloadUrl = getDownloadURL(snapshot.ref);
        return downloadUrl;
      });
      return url;
    });
    imgUrl = await Promise.all(imgPromise);
    if (!checkManagerList) {
      toast({
        description: "???????????? ??????????????????",
        status: "error",
        duration: 1000,
        isClosable: false,
      });
      return;
    }
    return new Promise((resolve) => {
      let managerArr = checkManagerList.map((el) => {
        let mng = {
          name: el.name,
          uid: el.id,
        };
        return mng;
      });

      let obj = {
        ...values,
        dateMonth: format(new Date(values.date), "yyyyMM"),
        imgUrl: imgUrl || "",
        writeOption: writeOption || "",
        editor: editorState,
        timestamp: CurDate.getTime(),
        writer_uid: userInfo.uid,
        manager: managerArr,
        state: "ing",
        nextManager: managerArr[0],
      };

      const listRef = ref(
        db,
        `board/list/${format(CurDate, "yyyyMMdd")}${uid}`
      );
      set(listRef, {
        ...obj,
      })
        .then(() => {
          toast({
            description: "?????? ?????? ???????????????.",
            status: "success",
            duration: 1000,
            isClosable: false,
          });
        })
        .then(() => {
          router.push("/board/wait");
          resolve();
        });
    });
  };

  const [radioList, setRadioList] = useState();
  const [typeCon, setTypeCon] = useState();
  useEffect(() => {
    const typeRef = ref(db, `board/type_list`);
    onValue(typeRef, (data) => {
      let arr = [];
      let conArr = [];
      data.forEach((el) => {
        arr.push(`${el.val().uid}_${el.val().title}`);
        conArr.push(el.val());
      });
      setTypeCon(conArr);
      setRadioList(arr);
    });

    return () => {
      off(typeRef);
    };
  }, []);

  const [writeOption, setWriteOption] = useState();
  const [curType, setCurType] = useState()
  useEffect(() => {
    if (watchRadio) {
      const currentType = typeCon.find((el) => el.uid === watchRadio);
      let option = {
        date: currentType.date || false,
        price: currentType.price || false,
      };
      setCurType(currentType)
      setWriteOption({
        ...option,
      });

      if(currentType.manager){
        setCheckManagerList(currentType.manager)
      }else{
        setCheckManagerList('')
      }
    }
  }, [watchRadio]);

  useEffect(() => {
    if (writeOption?.price) {
      const income = watchPrice[0];
      const spend = watchPrice[1];
      if (income > 10000000000) {
        setValue("income", 10000000000);
      }
      if (spend > 10000000000) {
        setValue("spend", 10000000000);
      }
      const formatIncome = numberToKorean(income);
      const formatSpend = numberToKorean(spend);
      incomeRef.current.innerText = formatIncome ? `${formatIncome}???` : null;
      spendRef.current.innerText = formatSpend ? `${formatSpend}???` : null;
    }
  }, [writeOption, watchPrice]);

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
    let newEditor = clearManager(editorState, managerList);
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

  const [uploadList, setUploadList] = useState([]);
  const onAddUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (file.size > 4194304) {
      toast({
        description: "???????????? ??????????????? 4MB ?????????.",
        status: "error",
        duration: 1000,
        isClosable: false,
      });
      e.target.value = null;
      return;
    } else {
      const newList = [...uploadList, file];
      setUploadList(newList);
      e.target.value = null;
    }
  };
  const removeFile = (uid) => {
    let newFileList = uploadList;
    newFileList = newFileList.filter((el) => {
      return el.lastModified !== uid;
    });
    setUploadList(newFileList);
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
      <BoardWrite style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
        <Flex>
          <Flex width="100%" flexDirection="column" gap={5}>
            <FormControl isInvalid={errors.subject}>
              <div className="row_box">
                <FormLabel className="label" htmlFor="subject">
                  ??????
                </FormLabel>
                <Input
                  id="subject"
                  className="lg"
                  placeholder="* ??????"
                  {...register("subject", {
                    required: "????????? ???????????? ?????????.",
                  })}
                />
              </div>
              <FormErrorMessage>
                {errors.subject && errors.subject.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.type}>
              <div className="row_box">
                <FormLabel className="label" htmlFor="type">
                  ??????
                </FormLabel>
                {radioList && (
                  <ComRadio
                    name={"type"}
                    list={radioList}
                    label={`??????`}
                    register={register}
                    {...register("type", {
                      required: "????????? ???????????? ?????????.",
                    })}
                  />
                )}
              </div>
              <FormErrorMessage>
                {errors.type && errors.type.message}
              </FormErrorMessage>
            </FormControl>
            {writeOption?.date && (
              <>
                <FormControl isInvalid={errors.date}>
                  <div className="row_box">
                    <FormLabel className="label" htmlFor="date">
                      ??????
                    </FormLabel>
                    <Input
                      id="date"
                      type="date"
                      className="xs"
                      placeholder="??????"
                      register={register}
                      {...register("date", {
                        required: "????????? ???????????? ?????????.",
                      })}
                    />
                  </div>
                  <FormErrorMessage>
                    {errors.date && errors.date.message}
                  </FormErrorMessage>
                </FormControl>
              </>
            )}
            {writeOption?.price && (
              <>
                <FormControl>
                  <div className="row_box">
                    <FormLabel className="label" htmlFor="income">
                      ????????????
                    </FormLabel>
                    <Input
                      id="income"
                      type="number"
                      className="xs"
                      {...register("income")}
                    />
                    <div className="price" ref={incomeRef}></div>
                  </div>
                </FormControl>
                <FormControl>
                  <div className="row_box">
                    <FormLabel className="label" htmlFor="spend">
                      ????????????
                    </FormLabel>
                    <Input
                      id="spend"
                      type="number"
                      className="xs"
                      {...register("spend")}
                    />
                    <div className="price" ref={spendRef}></div>
                  </div>
                </FormControl>
              </>
            )}

            {watchRadio && (
              <>
                <div onClick={onEditor}>
                  <Editor
                    disable={editorDisable}
                    insertHtml={insertHtml}
                    typeCon={typeCon}
                    handleEditor={handleEditor}
                    type={watchRadio}
                  />
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
                    {!curType?.manager &&
                    <div className="manager_sel_btn_box">
                      <Button colorScheme="teal" onClick={onManagerPop} ml={2}>
                        ????????? ??????
                      </Button>
                      <Button colorScheme="red" onClick={offManager} ml={2}>
                        ????????????
                      </Button>
                    </div>
                    }
                  </div>
                  <FormErrorMessage>
                    {errors.manager && errors.manager.message}
                  </FormErrorMessage>
                </FormControl>
                <UploadBox
                  onAddUpload={onAddUpload}
                  uploadList={uploadList}
                  removeFile={removeFile}
                />
              </>
            )}

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
            </Flex>
          </Flex>
        </Flex>
      </BoardWrite>
    </>
  );
}
