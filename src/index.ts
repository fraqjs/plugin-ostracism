import { definePlugin, msg, param, seg } from '@fraqjs/fraq';

function proposalKey(groupId: number, seq: number): string {
  return `ostracism:${groupId}:${seq}`;
}

interface Proposal {
  userId: number;
  initiatorId: number;
  votes: Set<number>;
}

export const OstracismPlugin = definePlugin({
  name: 'ostracism',
  apply(ctx) {
    const proposalMap = new Map<string, Proposal>();

    function addVote(groupId: number, seq: number, voterId: number) {
      const key = proposalKey(groupId, seq);
      const proposal = proposalMap.get(key);
      if (proposal) {
        proposal.votes.add(voterId);
      }
    }

    function removeVote(groupId: number, seq: number, voterId: number) {
      const key = proposalKey(groupId, seq);
      const proposal = proposalMap.get(key);
      if (proposal) {
        proposal.votes.delete(voterId);
      }
    }

    ctx.router
      .command('陶片禁言')
      .arg('member', param.segment('mention'))
      .execute(async (session, { member }) => {
        if (session.raw.message_scene !== 'group') {
          return;
        }
        const key = proposalKey(session.raw.peer_id, session.raw.message_seq);
        proposalMap.set(key, {
          userId: member.data.user_id,
          initiatorId: session.raw.sender_id,
          votes: new Set([session.raw.sender_id]),
        });

        // react 424 under the message as the vote button
        await ctx.client.send_group_message_reaction({
          group_id: session.raw.peer_id,
          message_seq: session.raw.message_seq,
          reaction: '424',
        });

        await session.reply(
          msg`已发起对 ${seg.mention(member.data.user_id)} 的禁言提案，请在上述消息下贴表情【${seg.face(424)}】以投票。如果 5 分钟内投票数达到 3 票或以上，该用户将被禁言。`,
          {
            withQuote: true,
          },
        );

        // wait for 5 minutes for votes
        ctx.timeout(5 * 60 * 1000, () => {
          const proposal = proposalMap.get(key);
          if (!proposal) {
            return;
          }
          const voteCount = proposal.votes.size;
          const groupId = session.raw.peer_id;
          const userId = proposal.userId;
          proposalMap.delete(key);
          if (voteCount >= 3) {
            // Mute the user for (count - 2) * 10 minutes
            const muteDuration = (voteCount - 2) * 10 * 60;
            ctx.client.set_group_member_mute({
              group_id: groupId,
              user_id: userId,
              duration: muteDuration,
            });
          }
        });
      });

    ctx.on('group_message_reaction', ({ data, self_id }) => {
      const key = proposalKey(data.group_id, data.message_seq);
      const proposal = proposalMap.get(key);
      if (!proposal) {
        return;
      }
      if (data.user_id === proposal.userId || data.user_id === proposal.initiatorId || data.user_id === self_id) {
        return;
      }
      if (data.face_id !== '424') {
        return;
      }
      if (data.is_add) {
        addVote(data.group_id, data.message_seq, data.user_id);
      } else {
        removeVote(data.group_id, data.message_seq, data.user_id);
      }
    });
  },
});

export default OstracismPlugin;
