import React, { useRef, useEffect, useState } from "react";
import styles from './LiveChat.module.css';
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { apiCall } from "../utils/api";
import { addMessage, setMessages } from "../actions";
import initUser from "../assets/images/init_user.png"

const LiveChat  = (props) => {
    // Create a ref for the messages container
    const messagesEndRef = useRef(null);
    const userId = Cookies.get('userId')
    const [msg, setMsg] = useState("")
    const [ws, setWs] = useState(null);
    const messages = useSelector(state => state.messagesReducer)
    const dispatch = useDispatch()


    const sendMessage = (text, profile_id) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const a = { content: text, profile_id , first_name: "test", image: null}
          ws.send(JSON.stringify(a))
        }
      }
    
    const handleSendMessage = () => {
        sendMessage(msg, parseInt(userId))
        setMsg("")
    }

    // Scroll to the bottom of the messages container whenever it updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]); // Include messages here
    

    useEffect(() => {
        console.log("props.chatTask",props.chatTask);
        const websocket = new WebSocket(`ws://localhost:8000/ws/${props.chatTask.task_id}`)
        setWs(websocket)
        websocket.onopen = () => {
            console.log('Connection is open');
          };
        console.log(messages);
      
  
        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);
            dispatch(addMessage(message))
          }

        websocket.onerror = (error) => {
            console.log('WebSocket error', error);
          };
      
          websocket.onclose = (event) => {
            console.log('WebSocket connection closed', event.code);
            dispatch(setMessages([]))
          };
      
        return () => {
        if (websocket) {
            websocket.close();
        }
        };
    }, [])

    if (!messages) {
        return <>Loading...</>
    }



    return (
        <div className="flex-1 p:2 sm:p-6 justify-between flex flex-col h-[calc(70vh)]">
            <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
                <div className="relative flex items-center space-x-4">
                    <div className="flex flex-col leading-tight">
                        <div className="text-2xl mt-1 flex items-center">
                        <span className="text-gray-700 mr-3">{props.chatTask.title}</span>
                        </div>
                        
                        <span className="text-lg text-gray-600">State: {props.chatTask.progress}</span>
                    </div>
                </div>
            </div>
            <div id="messages" className={`flex flex-col space-y-4 p-3 overflow-y-auto ${styles.scrollbarThumbBlue} ${styles.scrollbarThumbRound} ${styles.scrollbarTrackBlueLighter} ${styles.scrollbarW2} scrolling-touch`}>
                {messages.map((message, index) => {
                    if (parseInt(message.profile_id) !== parseInt(userId)){
                        return (
                            <div key={index} className="chat-message" ref={messagesEndRef}>
                                <div className="flex items-end">
                                    <div className="flex flex-col space-y-1 text-s max-w-xs mx-2 order-2 items-start">
                                    {((index > 0 && messages[index-1].profile_id === message.profile_id )? <></> :<span className="text-xs">{message.first_name}</span>)}
                                    <div><span className="px-4 py-2 rounded-lg inline-block rounded-bl-none bg-gray-300 text-gray-600">{message.content}</span></div>
                                    </div>
                                    <img src={(!message.image) ? initUser : message.image } alt="My profile" className="w-6 h-6 rounded-full order-1" / >
                                </div>
                            </div>
                        )
                    } else {
                        return (
                        <div key={index} className="chat-message" ref={messagesEndRef}>
                            <div className="flex items-end justify-end">
                                <div className="flex flex-col space-y-1 text-s max-w-xs mx-2 order-1 items-end">
                                {(((index > 0 && messages[index - 1].profile_id === parseInt(userId) )) ? <></> : <span className="text-xs">Me</span>)}
                                <div><span className="px-4 py-2 rounded-lg inline-block rounded-br-none bg-blue-600 text-white ">{message.content}</span></div>
                                </div>
                                <img src={(!message.image) ? initUser : message.image } alt="My profile" className="w-6 h-6 rounded-full order-2" />
                            </div>
                        </div>
                        )
                    } 

                })}
            </div>
            <div className="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
                <div className="relative flex">
                    <input type="text" placeholder="Message..." value={msg} onKeyUp={(e) => {if (e.key === "Enter") {handleSendMessage()}}} onChange={(e) => {setMsg(e.target.value)}} className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-gray-200 rounded-md py-3" />
                    <div className="absolute right-0 items-center inset-y-0 hidden sm:flex">
                        <button onClick={() => handleSendMessage()} type="button" className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none">
                        <span className="font-bold">Send</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 ml-2 transform rotate-90">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveChat;