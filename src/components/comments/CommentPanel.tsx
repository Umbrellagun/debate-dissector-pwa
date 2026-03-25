import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Comment } from '../../models';

interface CommentPanelProps {
  comments: Record<string, Comment>;
  activeCommentId?: string | null;
  onAddComment?: (text: string, selectedText: string) => void;
  onEditComment?: (commentId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onResolveComment?: (commentId: string) => void;
  onReplyComment?: (parentId: string, text: string, selectedText: string) => void;
  onCommentClick?: (commentId: string) => void;
  hasTextSelection?: boolean;
  selectedText?: string;
}

// Helper to format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

// Single reply row with same menu as parent comments
const ReplyRow: React.FC<{
  reply: Comment;
  parentId: string;
  onEdit?: (commentId: string, text: string) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onReply?: (parentId: string, text: string, selectedText: string) => void;
}> = ({ reply, parentId, onEdit, onDelete, onResolve, onReply }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.selectionStart = editInputRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isReplying]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== reply.text) {
      onEdit?.(reply.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply?.(parentId, replyText.trim(), reply.selectedText);
      setReplyText('');
      setIsReplying(false);
    }
  };

  return (
    <div className="group/reply py-1">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          {reply.resolved && (
            <svg className="w-3 h-3 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-[10px] text-gray-400">
            {formatRelativeTime(reply.createdAt)}
            {reply.updatedAt !== reply.createdAt && ' (edited)'}
          </span>
        </div>
        {/* Actions menu - same as parent comments */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover/reply:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
          >
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setEditText(reply.text);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve?.(reply.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              >
                {reply.resolved ? 'Unresolve' : 'Resolve'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReplying(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              >
                Reply
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(reply.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reply body */}
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={editInputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              }
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="w-full text-[11px] text-gray-700 border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
            rows={2}
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleSaveEdit}
              className="px-2 py-0.5 text-[10px] font-medium bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-[11px] leading-relaxed ${reply.resolved ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
          {reply.text}
        </p>
      )}

      {/* Reply to reply input */}
      {isReplying && (
        <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={replyInputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitReply();
              }
              if (e.key === 'Escape') {
                setIsReplying(false);
                setReplyText('');
              }
            }}
            placeholder="Write a reply..."
            className="w-full text-[11px] border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
            rows={2}
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              className="px-2 py-0.5 text-[10px] font-medium bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
            >
              Reply
            </button>
            <button
              onClick={() => { setIsReplying(false); setReplyText(''); }}
              className="px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Single comment row
const CommentRow: React.FC<{
  comment: Comment;
  isActive: boolean;
  replies: Comment[];
  allComments: Record<string, Comment>;
  onEdit?: (commentId: string, text: string) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onReply?: (parentId: string, text: string, selectedText: string) => void;
  onClick?: (commentId: string) => void;
}> = ({ comment, isActive, replies, allComments, onEdit, onDelete, onResolve, onReply, onClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.selectionStart = editInputRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isReplying]);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== comment.text) {
      onEdit?.(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply?.(comment.id, replyText.trim(), comment.selectedText);
      setReplyText('');
      setIsReplying(false);
    }
  };

  return (
    <div
      className={`group border-l-2 ${
        comment.resolved
          ? 'border-green-300 bg-green-50/50'
          : isActive
          ? 'border-amber-400 bg-amber-50'
          : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
      } rounded-r-lg transition-colors cursor-pointer`}
      onClick={() => !isEditing && onClick?.(comment.id)}
    >
      <div className="px-3 py-2.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {comment.resolved && (
              <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="text-[10px] text-gray-400">
              {formatRelativeTime(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && ' (edited)'}
            </span>
          </div>

          {/* Actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setEditText(comment.text);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve?.(comment.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                >
                  {comment.resolved ? 'Unresolve' : 'Resolve'}
                </button>
                {!comment.parentId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReplying(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    Reply
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(comment.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected text preview */}
        {comment.selectedText && !comment.parentId && (
          <div className="mb-1.5 px-2 py-1 bg-amber-100/60 border-l-2 border-amber-300 rounded text-[11px] text-gray-600 italic line-clamp-2">
            "{comment.selectedText}"
          </div>
        )}

        {/* Comment body */}
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              ref={editInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="w-full text-xs text-gray-700 border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
              rows={2}
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleSaveEdit}
                className="px-2 py-0.5 text-[10px] font-medium bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-xs leading-relaxed ${comment.resolved ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {comment.text}
          </p>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-2 pl-3 border-l border-gray-200 space-y-1">
            {replies.map(reply => (
              <ReplyRow
                key={reply.id}
                reply={reply}
                parentId={comment.id}
                onEdit={onEdit}
                onDelete={onDelete}
                onResolve={onResolve}
                onReply={onReply}
              />
            ))}
          </div>
        )}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-2 pl-3 border-l border-amber-300" onClick={(e) => e.stopPropagation()}>
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
                if (e.key === 'Escape') {
                  setIsReplying(false);
                  setReplyText('');
                }
              }}
              placeholder="Write a reply..."
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
              rows={2}
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim()}
                className="px-2 py-0.5 text-[10px] font-medium bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyText('');
                }}
                className="px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentPanel: React.FC<CommentPanelProps> = ({
  comments,
  activeCommentId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveComment,
  onReplyComment,
  onCommentClick,
  hasTextSelection = false,
  selectedText = '',
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showResolved, setShowResolved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim()) return;
    onAddComment?.(newCommentText.trim(), selectedText);
    setNewCommentText('');
    setIsAdding(false);
  }, [newCommentText, selectedText, onAddComment]);

  // Organize comments: top-level + replies grouped
  const commentEntries = Object.values(comments);
  const topLevelComments = commentEntries
    .filter(c => !c.parentId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const getReplies = (parentId: string): Comment[] =>
    commentEntries
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.createdAt - b.createdAt);

  const unresolvedCount = topLevelComments.filter(c => !c.resolved).length;
  const resolvedCount = topLevelComments.filter(c => c.resolved).length;

  const visibleComments = showResolved
    ? topLevelComments
    : topLevelComments.filter(c => !c.resolved);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Comments
          </h3>
          <div className="flex items-center gap-2">
            {resolvedCount > 0 && (
              <button
                onClick={() => setShowResolved(!showResolved)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  showResolved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {showResolved ? 'Hide' : 'Show'} resolved ({resolvedCount})
              </button>
            )}
            <span className="text-xs text-gray-400">
              {unresolvedCount} open
            </span>
          </div>
        </div>
      </div>

      {/* New comment input */}
      <div className="px-4 py-3 border-b border-gray-200 shrink-0">
        {isAdding ? (
          <div>
            {selectedText && (
              <div className="mb-2 px-2 py-1 bg-amber-50 border-l-2 border-amber-300 rounded text-[11px] text-gray-500 italic line-clamp-2">
                "{selectedText}"
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCommentText('');
                }
              }}
              placeholder="Write your comment..."
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewCommentText('');
                }}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
                className="px-3 py-1 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            disabled={!hasTextSelection}
            className={`w-full text-left px-3 py-2 text-xs border border-dashed rounded-lg transition-colors ${
              hasTextSelection
                ? 'border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400 cursor-pointer'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {hasTextSelection ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add comment to selection
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-3 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Select text to add a comment
              </span>
            )}
          </button>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {visibleComments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h6m-3 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-xs text-gray-400">
              {unresolvedCount === 0 && resolvedCount > 0
                ? 'All comments resolved!'
                : 'No comments yet'}
            </p>
            <p className="text-[10px] text-gray-300 mt-1">
              Select text and click "Add comment" to get started
            </p>
          </div>
        ) : (
          visibleComments.map(comment => (
            <CommentRow
              key={comment.id}
              comment={comment}
              isActive={activeCommentId === comment.id}
              replies={getReplies(comment.id)}
              allComments={comments}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onResolve={onResolveComment}
              onReply={onReplyComment}
              onClick={onCommentClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
