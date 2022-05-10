import { IoMdSend } from 'react-icons/io';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Picker from 'emoji-picker-react';
import { MdInsertEmoticon } from 'react-icons/md';
import { io } from 'socket.io-client';
import ChatRooms from '../components/Chats/ChatRooms';
import Message from '../components/Chats/Message';
import Reservation from '../components/Chats/Reservation';
import MessageNull from '../components/Chats/MessageNull';
import RecieverName from '../components/Chats/RecieverName';

export default function Chat({ setReservationModal }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [receiverUser, setReceiverUser] = useState([]);
  const [message, setMessage] = useState(null);
  const socket = useRef(io('ws://localhost:4000'));
  const [newMessage, setNewMessage] = useState('');
  const [arrivalMessage, setArrivalMessgae] = useState('');
  const { chatRoomId } = useParams();
  const [showEmoji, setShowEmojij] = useState(false);
  const userInfo = useSelector((state) => state.userInfo);

  useEffect(() => {
    socket.current.emit('addUser', userInfo.id);
    socket.current.on('getUsers', (users) => {
      console.log(users);
    });
  }, [userInfo]);

  useEffect(() => {
    socket.current.emit('ping', newMessage);
    socket.current.on('pong', (data) => {
      console.log(data);
    });
  }, [newMessage]);
  const emojiShowHide = () => {
    setShowEmojij(!showEmoji);
  };

  const handleEmojiClick = (e, emojiObject) => {
    let msg = newMessage;
    msg += emojiObject.emoji;
    setNewMessage(msg);
  };

  // 자동 textaarea높이 지정
  const autoResizeTextarea = () => {
    const textarea = document.querySelector('.autoTextarea');
    if (textarea) {
      textarea.style.height = 'auto';
      const height = textarea.scrollHeight;
      textarea.style.height = `${height + 8}px`;
    }
  };
  const timeago = (createdat) => {
    const milliSeconds = new Date() - createdat;
    const seconds = milliSeconds / 1000;
    if (seconds < 60) return `방금 전`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}분 전`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}시간 전`;
    const days = hours / 24;
    if (days < 7) return `${Math.floor(days)}일 전`;
    const weeks = days / 7;
    if (weeks < 5) return `${Math.floor(weeks)}주 전`;
    const months = days / 30;
    if (months < 12) return `${Math.floor(months)}개월 전`;
    const years = days / 365;
    return `${Math.floor(years)}년 전`;
  };

  const handleSubmit = async (e) => {
    const data = {
      userId: 0,
      createdAt: new Date(),
      chats: newMessage,
    };
    try {
      const res = await axios.post(
        `http://localhost:4001/chatRooms/${chatRoomId}`,
        data,
      );
      setNewMessage('');
    } catch (err) {
      console.log(err);
      setNewMessage('');
    }
  };

  useEffect(() => {
    const getMessage = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4001/chatRooms/${chatRoomId}`,
        );
        setMessage(res.data.chatContents);
        setReceiverUser(res.data.receiverId);
      } catch (err) {
        console.log(err);
      }
    };
    getMessage();
  }, [chatRoomId]);

  useEffect(() => {
    const getChatRooms = async () => {
      try {
        const res = await axios.get('http://localhost:4001/chatRooms');
        setChatRooms(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getChatRooms();
  }, []);

  return (
    <div className="chat">
      <div className="back">
        <div className="inner">
          <div className="chat-rooms">
            <div className="chat-rooms-wrraper">
              <div className="nickname"> {userInfo.name} </div>
              <div className="chatRooms">
                {chatRooms.map((chatRoom) => (
                  <Link to={`${chatRoom.id}`}>
                    <ChatRooms chatRoom={chatRoom} timeago={timeago} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="chat-message">
            <div className="chat-message-wrraper">
              {message ? (
                <>
                  <RecieverName receiverUser={receiverUser} />
                  <Reservation setReservationModal={setReservationModal} />
                </>
              ) : null}
              <div className="messages">
                {message ? (
                  message.map((chat) => (
                    <Message
                      chat={chat}
                      reverse={chat.userId !== 0}
                      timeago={timeago}
                      receiverUser={receiverUser}
                    />
                  ))
                ) : (
                  <MessageNull />
                )}
              </div>
              {message ? (
                <div className="send-chat-input">
                  <div className="emoji">
                    {showEmoji && <Picker onEmojiClick={handleEmojiClick} />}
                    <MdInsertEmoticon
                      size="24"
                      color="grey"
                      onClick={emojiShowHide}
                    />
                  </div>
                  <form className="input-wrraper">
                    <textarea
                      placeholder="메시지를 입력하세요"
                      rows="1"
                      className="autoTextarea"
                      onKeyDown={autoResizeTextarea}
                      onKeyUp={autoResizeTextarea}
                      onChange={(e) => setNewMessage(e.target.value)}
                      value={newMessage}
                      onKeyPress={(e) =>
                        e.key === 'Enter' ? handleSubmit() : null
                      }
                    />
                    {newMessage ? (
                      <button
                        type="button"
                        className={newMessage === '' ? 'send' : 'send active'}
                        onClick={handleSubmit}
                      >
                        <IoMdSend size="30" />
                      </button>
                    ) : null}
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
