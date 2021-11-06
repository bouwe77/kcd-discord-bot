import type * as TDiscord from 'discord.js'
import {getMentionedUser, getTextChannel, hasReactionFromUser} from './utils'

type ReactionFn = {
  (message: TDiscord.MessageReaction): Promise<unknown>
  description?: string
}

const reactions: Record<string, ReactionFn | undefined> = {
  bothelp: help,
  botask: ask,
  botofficehours: officeHours,
  botdontasktoask: dontAskToAsk,
  botdouble: doubleAsk,
  botconfirm: deleteConfirmedMessage,
} as const

async function ask(messageReaction: TDiscord.MessageReaction) {
  await messageReaction.message.reply(
    `We appreciate your question and we'll do our best to help you when we can. Could you please give us more details? Please follow the guidelines in <https://kcd.im/ask> (especially the part about making a <https://kcd.im/repro>) and then we'll be able to answer your question.`,
  )
  await messageReaction.remove()
}

async function doubleAsk(messageReaction: TDiscord.MessageReaction) {
  await messageReaction.message.reply(
    `Please avoid posting the same thing in multiple channels. Choose the best channel, and wait for a response there. Please delete the other message to avoid fragmenting the answers and causing confusion. Thanks!`,
  )
  await messageReaction.remove()
}

async function officeHours(messageReaction: TDiscord.MessageReaction) {
  const message = messageReaction.message
  const officeHoursChannel = getTextChannel(message.guild, 'kcd-office-hours')
  if (!officeHoursChannel) return

  await message.reply(
    `If you don't get a satisfactory answer here, feel free to ask Kent in ${officeHoursChannel} and he'll do his best to answer during his <https://kcd.im/office-hours>. To do so, formulate your question to make sure it's clear (follow the guidelines in <https://kcd.im/ask>) and a <https://kcd.im/repro> helps a lot if applicable. Then post it to ${officeHoursChannel} or join the meeting and ask live. Kent streams/records his office hours on YouTube so even if you can't make it in person, you should be able to watch his answer later.`,
  )
  await messageReaction.remove()
}

async function dontAskToAsk(messageReaction: TDiscord.MessageReaction) {
  const message = messageReaction.message
  await message.reply(
    `We're happy to answer your questions if we can, so you don't need to ask if you can ask. Learn more: <https://dontasktoask.com>`,
  )
  await messageReaction.remove()
}

async function help(messageReaction: TDiscord.MessageReaction) {
  const helpRequester = messageReaction.users.cache.first()
  if (!helpRequester) return

  const botsChannel = getTextChannel(
    messageReaction.message.guild,
    'talk-to-bots',
  )
  if (!botsChannel) return

  await botsChannel.send(
    `
${helpRequester} Here are the available bot reactions:

- bothelp: Lists available bot reactions.
- botask: Sends a reply to the message author explaining how to improve their question.
- botofficehours: Sends a reply to the message author explaining how to ask their question during Office Hours.
- botdontasktoask: Sends a reply to the message author explaining that they don't need to ask to ask.
- botdouble: Sends a reply to the message author explaining that they shouldn't ask the same question twice.`,
  )
  await messageReaction.remove()
}

async function deleteConfirmedMessage(
  messageReaction: TDiscord.MessageReaction,
) {
  const botMessagesChannel = getTextChannel(
    messageReaction.message.guild,
    'bot-messages',
  )
  if (!botMessagesChannel) return

  if (messageReaction.message.channel !== botMessagesChannel) return

  const mentionedUser = await getMentionedUser(messageReaction.message)
  if (!mentionedUser) return

  const hasMentionedUserReacted = await hasReactionFromUser(
    messageReaction.message,
    mentionedUser,
    'botconfirm',
  )
  if (hasMentionedUserReacted) await messageReaction.message.delete()
  // no need to remove the reaction now because the message is gone...
}

export default reactions
