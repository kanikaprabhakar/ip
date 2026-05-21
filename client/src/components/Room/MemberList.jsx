import React from 'react';

const MemberList = ({ activeMembers, canManageMembers, currentUserId, onKickMember }) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">Active Members</h3>
      <div className="space-y-3">
        {activeMembers.length > 0 ? (
          activeMembers.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
              <img
                src={member.userPhoto || 'https://via.placeholder.com/40'}
                alt={member.userName}
                className="w-8 h-8 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = 'https://via.placeholder.com/40';
                }}
              />
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">{member.userName}</p>
                {member.currentTask && (
                  <p className="text-white/40 text-xs truncate">{member.currentTask}</p>
                )}
              </div>
              {canManageMembers && member.userId !== currentUserId ? (
                <button
                  onClick={() => onKickMember?.(member.userId)}
                  className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                >
                  Kick
                </button>
              ) : (
                <div className="w-2 h-2 bg-teal-accent rounded-full" />
              )}
            </div>
          ))
        ) : (
          <p className="text-white/40 text-sm">No members yet</p>
        )}
      </div>
    </div>
  );
};

export default MemberList;
