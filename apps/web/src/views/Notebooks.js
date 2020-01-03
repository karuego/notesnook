import React, { useState, useEffect } from "react";
import { Flex, Box, Text, Button as RebassButton } from "rebass";
import { Input, Checkbox, Label } from "@rebass/forms";
import Button from "../components/button";
import * as Icon from "react-feather";
import theme, { DIALOG_SHADOW } from "../theme";
import Search from "../components/search";
import Modal from "react-modal";
import { db, ev } from "../common";
import { showSnack } from "../components/snackbar";
import { Virtuoso as List } from "react-virtuoso";
import Notebook from "../components/notebook";
import Topic from "../components/topic";
import Note from "../components/note";
import { routes, navigationEvents, goBack as p_goBack } from "../navigation";

const inputRefs = [];
const history = [{}];
const Notebooks = props => {
  const [open, setOpen] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [selected, setSelected] = useState({});
  const [intent, setIntent] = useState(props.intent);
  useEffect(() => {
    function onRefresh() {
      console.log("Refreshing notebooks");
      setNotebooks(db.getNotebooks());
    }
    onRefresh();
    navigationEvents.onWillNavigateAway = (routeName, params) => {
      if (routeName !== "notebooks" && intent === "moveNote") {
        return window.confirm(
          "Are you sure you want to navigate away? Your note selection will be lost."
        );
      }
      return true;
    };
    ev.addListener("refreshNotebooks", onRefresh);
    return () => {
      ev.removeListener("refreshNotebooks", onRefresh);
      Notebooks.onRefresh = undefined;
    };
  }, []);
  function navigate(item, save = true, title = undefined) {
    //transform notes in a topic to real notes
    if (item.notes) {
      item = { ...item };
      item.notes = db.getTopic(selected.dateCreated, item.title);
    }
    if (save) {
      history[history.length] = selected;
    }
    //set notebook title if we are inside the notebook else set the provided or item's title.
    title =
      selected.type === "notebook"
        ? selected.title
        : title || item.title || routes.notebooks.title;
    props.changeTitle(title);
    props.canGoBack(item.title !== undefined);
    props.backAction(goBack);

    setSelected((item.title && item) || {});
  }
  function goBack() {
    navigate(history.pop(), false);
  }
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {notebooks.length > 0 ? (
        <Flex flexDirection="column" flex="1 1 auto">
          {selected.type === "topic" && (
            <Text variant="title" color="primary">
              {selected.title}
            </Text>
          )}
          {intent === "moveNote" && selected.type !== "topic" && (
            <Text variant="body" color="primary" fontWeight="bold">
              Please select a{" "}
              {selected.type === "notebook" ? "topic" : "notebook"} to move the
              note to:
            </Text>
          )}
          <Search placeholder="Search" />
          <List
            style={{
              width: "100%",
              flex: "1 1 auto",
              height: "auto",
              overflowX: "hidden"
            }}
            totalCount={
              selected.type === "notebook"
                ? selected.topics.length
                : selected.type === "topic"
                ? selected.notes.length
                : notebooks.length
            }
            item={index => {
              return selected.type === "notebook" ? (
                <Topic
                  index={index}
                  item={selected.topics[index]}
                  onClick={() => navigate(selected.topics[index])}
                />
              ) : selected.type === "topic" ? (
                <Note index={index} item={selected.notes[index]} />
              ) : (
                <Notebook
                  index={index}
                  item={notebooks[index]}
                  onClick={() => navigate(notebooks[index])}
                  onTopicClick={(notebook, topic) =>
                    navigate(topic, true, notebook.title)
                  }
                />
              );
            }}
          />
          <Button
            Icon={
              intent === "moveNote" && selected.type === "topic"
                ? Icon.Move
                : Icon.Plus
            }
            onClick={async () => {
              if (intent === "moveNote" && selected.type === "topic") {
                let to = {
                  notebook: history[history.length - 1].dateCreated,
                  topic: selected.title
                };
                db.moveNote(props.data.dateCreated, props.data.notebook, to)
                  .then(
                    result =>
                      result &&
                      showSnack(
                        `Moved note to ${history[history.length - 1].title}.`
                      )
                  )
                  .catch(err => showSnack(err.message));
                p_goBack();
                setIntent(undefined);
              } else {
                setOpen(true);
              }
            }}
            content={
              selected.type === "notebook"
                ? "Add more topics"
                : selected.type === "topic"
                ? intent === "moveNote"
                  ? "Move note here"
                  : "Make a new note"
                : "Create a notebook"
            }
          />
        </Flex>
      ) : (
        <Flex
          flex="1 1 auto"
          alignItems="center"
          justifyContent="center"
          color="#9b9b9b"
          flexDirection="column"
        >
          <Icon.Book size={72} strokeWidth={1.5} />
          <Text variant="title">You have no notebooks</Text>
          <Button
            Icon={Icon.Plus}
            content="Let's create one"
            onClick={() => setOpen(true)}
            style={{ marginTop: 2, textAlign: "center" }}
            width={"auto"}
          />
        </Flex>
      )}
      <CreateNotebookDialog
        open={open}
        onDone={async (topics, title, description) => {
          if (await db.addNotebook({ title, description, topics })) {
            setNotebooks(db.getNotebooks());
            setOpen(false);
          } else {
            showSnack("Please fill out the notebook title.");
          }
        }}
        close={() => setOpen(false)}
      />
    </Flex>
  );
};

const CreateNotebookDialog = props => {
  const [topics, setTopics] = useState([""]);
  const addTopic = index => {
    topics.splice(index + 1, 0, "");
    setTopics([...topics]);
    setTimeout(() => {
      inputRefs[index + 1].focus();
    }, 0);
  };
  return (
    <Modal
      isOpen={props.open}
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          borderWidth: 0,
          borderRadius: theme.radii["default"],
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          boxShadow: theme.shadows["3"],
          width: "20%",
          paddingRight: 40,
          paddingLeft: 40,
          overflowY: "hidden"
        },
        overlay: {
          background: theme.colors.overlay
        }
      }}
      contentLabel="Add a Notebook"
    >
      <Flex flexDirection="column">
        <Flex
          flexDirection="row"
          alignItems="center"
          alignSelf="center"
          justifyContent="center"
          color="primary"
          py={2}
        >
          <Box height={42}>
            <Icon.BookOpen size={42} />
          </Box>
          <Text
            mx={2}
            as="span"
            variant="title"
            fontSize={28}
            textAlign="center"
          >
            Notebook
          </Text>
        </Flex>
        <Box my={1}>
          <Input
            variant="default"
            onChange={e => (CreateNotebookDialog.title = e.target.value)}
            placeholder="Enter name"
          />
          <Input
            variant="default"
            sx={{ marginTop: 1 }}
            onChange={e => (CreateNotebookDialog.description = e.target.value)}
            placeholder="Enter description (optional)"
          />
          <Label alignItems="center" my={1}>
            <Checkbox variant="checkbox" />
            Locked?
          </Label>
          <Text variant="body" fontWeight="bold" my={1}>
            Topics (optional):
          </Text>
          <Box sx={{ maxHeight: 44 * 5, overflowY: "auto", marginBottom: 1 }}>
            {topics.map((value, index) => (
              <Flex
                key={index.toString()}
                flexDirection="row"
                sx={{ marginBottom: 1 }}
              >
                <Input
                  ref={ref => (inputRefs[index] = ref)}
                  variant="default"
                  value={topics[index]}
                  placeholder="Topic name"
                  onFocus={e => {
                    Notebooks.lastLength = e.nativeEvent.target.value.length;
                  }}
                  onChange={e => {
                    topics[index] = e.target.value;
                    setTopics([...topics]);
                  }}
                  onKeyUp={e => {
                    if (e.nativeEvent.key === "Enter") {
                      addTopic(index);
                    } else if (
                      e.nativeEvent.key === "Backspace" &&
                      Notebooks.lastLength === 0 &&
                      index > 0
                    ) {
                      topics.splice(index, 1);
                      setTopics([...topics]);
                      setTimeout(() => {
                        inputRefs[index - 1].focus();
                      }, 0);
                    }
                    Notebooks.lastLength = e.nativeEvent.target.value.length;
                  }}
                />
                <RebassButton
                  variant="tertiary"
                  sx={{ marginLeft: 1 }}
                  px={2}
                  py={1}
                  onClick={() => addTopic(index)}
                >
                  <Box height={20}>
                    <Icon.Plus size={20} />
                  </Box>
                </RebassButton>
              </Flex>
            ))}
          </Box>
        </Box>
        <Flex flexDirection="row" justifyContent="center" alignItems="center">
          <RebassButton
            variant="primary"
            mx={1}
            onClick={() =>
              props.onDone(
                topics,
                CreateNotebookDialog.title,
                CreateNotebookDialog.description
              )
            }
          >
            Done
          </RebassButton>
          <RebassButton variant="secondary" onClick={props.close}>
            Cancel
          </RebassButton>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default Notebooks;
