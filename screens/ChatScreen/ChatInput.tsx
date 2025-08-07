import React, { useRef, useEffect } from 'react';
//@ts-ignore
import styles from './ChatScreen.module.css';
import { FaPlus, FaSmile } from 'react-icons/fa';
import { MdSend } from 'react-icons/md';
import { UI } from '@/constants';
import Picker from '@emoji-mart/react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  handleEmojiSelect: (emoji: any) => void;
  replyToMessage?: any;
  setReplyToMessage?: (msg: any) => void;
  editingMessage?: any;
  onCancelEdit?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  file,
  setFile,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiSelect,
  replyToMessage,
  setReplyToMessage,
  editingMessage,
  onCancelEdit,
  disabled = false,
  disabledMessage = "You cannot send messages",
}) => {
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, setShowEmojiPicker]);

  return (
    <>
      {replyToMessage && (
        <div className={styles.composerReplyPreview}>
          <div className={styles.composerReplyContent}>{replyToMessage.content}</div>
          <button className={styles.composerReplyCloseBtn} onClick={() => setReplyToMessage && setReplyToMessage(null)} title="Cancel reply">×</button>
        </div>
      )}
      {editingMessage && (
        <div className={styles.composerEditPreview}>
          <div className={styles.composerEditLabel}>{UI.MESSAGE.EDITING_MESSAGE}</div>
          <div className={styles.composerEditContent}>{editingMessage.content}</div>
          <button className={styles.composerEditCloseBtn} onClick={onCancelEdit} title="Cancel edit">×</button>
        </div>
      )}
      {file && (
        <div className={styles.composerPreviewWrapper}>
          {file.type.startsWith('image/') ? (
            <div className={styles.composerImagePreviewBox}>
              <img src={file ? URL.createObjectURL(file) : ''} alt={file ? file.name : ''} className={styles.composerImagePreview} />
              <button className={styles.composerPreviewRemoveBtn} onClick={() => setFile(null)} title="Remove">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ) : (
            <div className={styles.composerFilePreviewBox}>
              <span className={styles.composerFileName}>{file.name}</span>
              <button className={styles.composerPreviewRemoveBtn} onClick={() => setFile(null)} title="Remove">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          )}
        </div>
      )}
      {disabled && (
        <div className={styles.disabledInputMessage}>
          {disabledMessage}
        </div>
      )}
      <div className={`${styles.chatInputArea} ${disabled ? styles.disabled : ''}`}>
        <button
          type="button"
          className={styles.chatFileLabel}
          title="Attach"
          onClick={() => !disabled && document.getElementById('fileInput')?.click()}
          disabled={disabled}
        >
          <FaPlus color="#747881" size={20} />
          <input
            id="fileInput"
            type="file"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
            }}
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            disabled={disabled}
          />
        </button>
        <div className={styles.chatInputWrapper}>
          <input
            type="text"
            placeholder={disabled ? disabledMessage : editingMessage ? "Edit your message..." : "Type your message"}
            value={input}
            onChange={e => !disabled && setInput(e.target.value)}
            className={`${styles.chatInput} ${styles.chatInputField}`}
            onKeyDown={e => {
              if (disabled) return;
              if (e.key === 'Enter') {
                onSend();
              } else if (e.key === 'Escape' && editingMessage && onCancelEdit) {
                onCancelEdit();
              }
            }}
            disabled={disabled}
          />
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className={`${styles.emojiBtn} ${styles.chatEmojiBtn}`}
              onClick={() => !disabled && setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
              ref={emojiBtnRef}
              disabled={disabled}
            >
              <FaSmile color="#747881" />
            </button>
            {showEmojiPicker && !disabled && (
              <div className={styles.emojiPickerWrapper} ref={emojiPickerRef}>
                <Picker onEmojiSelect={handleEmojiSelect} theme="light" />
              </div>
            )}
          </div>
          <button
            className={`${styles.sendBtn} ${styles.chatSendBtn} ${editingMessage ? styles.editBtn : ''}`}
            onClick={() => !disabled && onSend()}
            title={editingMessage ? UI.MESSAGE.SAVE_EDIT : "Send"}
            disabled={disabled}
          >
            {editingMessage ? (
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{UI.MESSAGE.SAVE_EDIT}</span>
            ) : (
              <MdSend style={{ color: '#fff' }} size={25} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatInput; 