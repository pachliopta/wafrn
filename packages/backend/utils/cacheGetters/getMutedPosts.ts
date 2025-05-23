import { Op } from 'sequelize'
import { sequelize, SilencedPost } from '../../db.js'
import { redisCache } from '../redis.js'

async function getMutedPosts(userId: string, superMute = false): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get((superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId)
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const mutedPostsQuery = await SilencedPost.findAll({
      where: {
        userId: userId,
        superMuted: superMute
          ? true
          : {
              [Op.in]: [true, false, null, undefined] // yeah ok this is a bit dirty haha but its only one code path
            }
      },
      attributes: ['postId']
    })
    res = mutedPostsQuery.map((elem: any) => elem.postId)
    if (superMute && res.length) {
      const muted = res.map((elem) => "'" + (elem ? elem : '00000000-0000-0000-0000-000000000000') + "'")
      const mutedPosts = await sequelize.query(
        `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${muted})`
      )
      res = mutedPosts[0].map((elem) => elem.postsId)
    }
    await redisCache.set((superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId, JSON.stringify(res), 'EX', 600)
  }
  return res
}

async function getMutedPostsMultiple(userIds: string[], superMute = false) {
  const cacheResults = await redisCache.mget(
    userIds.map((userId) => (superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId)
  )

  if (cacheResults.every((result) => !!result)) {
    const ids = cacheResults.map((result) => JSON.parse(result!) as string[])
    return ids.flat()
  }

  const where = {
    userId: {
      [Op.in]: userIds
    }
  } as { userId: Record<any, any>; superMuted?: true }

  if (superMute) {
    where.superMuted = true
  }

  const mutedFirstIds = await SilencedPost.findAll({
    where,
    attributes: ['postId', 'userId']
  })

  let postIds: string[] = []
  for (const result of cacheResults) {
    if (result) {
      postIds.push(...(JSON.parse(result) as string[]))
    } else {
      const index = cacheResults.indexOf(result)
      const userId = userIds[index]

      let newPostIds = mutedFirstIds.filter((elem) => elem.userId === userId).map((elem) => elem.postId)
      if (superMute && newPostIds.length) {
        const mutedPosts = await sequelize.query(
          `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${newPostIds.map((elem) => "'" + elem + "'")})`
        )
        newPostIds = mutedPosts[0].map((elem) => elem.postsId)
      }
      await redisCache.set(
        (superMute ? 'superMutedPosts:' : 'mutedPosts:') + userIds[index],
        JSON.stringify(newPostIds),
        'EX',
        600
      )
      postIds.push(...newPostIds)
    }
  }

  return postIds
}

export { getMutedPosts, getMutedPostsMultiple }
