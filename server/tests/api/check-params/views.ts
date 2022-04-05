/* eslint-disable @typescript-eslint/no-unused-expressions,@typescript-eslint/require-await */

import 'mocha'
import { HttpStatusCode, VideoPrivacy } from '@shared/models'
import {
  cleanupTests,
  createMultipleServers,
  doubleFollow,
  PeerTubeServer,
  setAccessTokensToServers,
  setDefaultVideoChannel
} from '@shared/server-commands'

describe('Test videos views', function () {
  let servers: PeerTubeServer[]
  let liveVideoId: string
  let videoId: string
  let remoteVideoId: string
  let userAccessToken: string

  before(async function () {
    this.timeout(30000)

    servers = await createMultipleServers(2)
    await setAccessTokensToServers(servers)
    await setDefaultVideoChannel(servers)

    await servers[0].config.enableLive({ allowReplay: false, transcoding: false });

    ({ uuid: videoId } = await servers[0].videos.quickUpload({ name: 'video' }));
    ({ uuid: remoteVideoId } = await servers[1].videos.quickUpload({ name: 'video' }));
    ({ uuid: liveVideoId } = await servers[0].live.create({
      fields: {
        name: 'live',
        privacy: VideoPrivacy.PUBLIC,
        channelId: servers[0].store.channel.id
      }
    }))

    userAccessToken = await servers[0].users.generateUserAndToken('user')

    await doubleFollow(servers[0], servers[1])
  })

  describe('When viewing a video', async function () {

    // TODO: implement it when we'll remove backward compatibility in REST API
    it('Should fail without current time')

    it('Should fail with an invalid current time', async function () {
      await servers[0].views.view({ id: videoId, currentTime: -1, expectedStatus: HttpStatusCode.BAD_REQUEST_400 })
      await servers[0].views.view({ id: videoId, currentTime: 10, expectedStatus: HttpStatusCode.BAD_REQUEST_400 })
    })

    it('Should succeed with correct parameters', async function () {
      await servers[0].views.view({ id: videoId, currentTime: 1 })
    })
  })

  describe('When getting overall stats', function () {

    it('Should fail with a remote video', async function () {
      await servers[0].videoStats.getOverallStats({ videoId: remoteVideoId, expectedStatus: HttpStatusCode.FORBIDDEN_403 })
    })

    it('Should fail without token', async function () {
      await servers[0].videoStats.getOverallStats({ videoId: videoId, token: null, expectedStatus: HttpStatusCode.UNAUTHORIZED_401 })
    })

    it('Should fail with another token', async function () {
      await servers[0].videoStats.getOverallStats({
        videoId: videoId,
        token: userAccessToken,
        expectedStatus: HttpStatusCode.FORBIDDEN_403
      })
    })

    it('Should succeed with the correct parameters', async function () {
      await servers[0].videoStats.getOverallStats({ videoId })
    })
  })

  describe('When getting timeserie stats', function () {

    it('Should fail with a remote video', async function () {
      await servers[0].videoStats.getTimeserieStats({
        videoId: remoteVideoId,
        metric: 'viewers',
        expectedStatus: HttpStatusCode.FORBIDDEN_403
      })
    })

    it('Should fail without token', async function () {
      await servers[0].videoStats.getTimeserieStats({
        videoId: videoId,
        token: null,
        metric: 'viewers',
        expectedStatus: HttpStatusCode.UNAUTHORIZED_401
      })
    })

    it('Should fail with another token', async function () {
      await servers[0].videoStats.getTimeserieStats({
        videoId: videoId,
        token: userAccessToken,
        metric: 'viewers',
        expectedStatus: HttpStatusCode.FORBIDDEN_403
      })
    })

    it('Should fail with an invalid metric', async function () {
      await servers[0].videoStats.getTimeserieStats({ videoId, metric: 'hello' as any, expectedStatus: HttpStatusCode.BAD_REQUEST_400 })
    })

    it('Should succeed with the correct parameters', async function () {
      await servers[0].videoStats.getTimeserieStats({ videoId, metric: 'viewers' })
    })
  })

  describe('When getting retention stats', function () {

    it('Should fail with a remote video', async function () {
      await servers[0].videoStats.getRetentionStats({
        videoId: remoteVideoId,
        expectedStatus: HttpStatusCode.FORBIDDEN_403
      })
    })

    it('Should fail without token', async function () {
      await servers[0].videoStats.getRetentionStats({
        videoId: videoId,
        token: null,
        expectedStatus: HttpStatusCode.UNAUTHORIZED_401
      })
    })

    it('Should fail with another token', async function () {
      await servers[0].videoStats.getRetentionStats({
        videoId: videoId,
        token: userAccessToken,
        expectedStatus: HttpStatusCode.FORBIDDEN_403
      })
    })

    it('Should fail on live video', async function () {
      await servers[0].videoStats.getRetentionStats({ videoId: liveVideoId, expectedStatus: HttpStatusCode.BAD_REQUEST_400 })
    })

    it('Should succeed with the correct parameters', async function () {
      await servers[0].videoStats.getRetentionStats({ videoId })
    })
  })

  after(async function () {
    await cleanupTests(servers)
  })
})