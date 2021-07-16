import axios from 'axios'
import contentful from 'contentful-management'
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import imap from 'imap-simple'
import Instagram from 'instagram-web-api'
import jimp from 'jimp'
import _ from 'lodash'
import mailparser from 'mailparser'
import cron from 'node-cron'
import path from 'path'

dotenv.config()
const app = express()
const {
  IG_USERNAME,
  IG_PASSWORD,
  EMAIL_USERNAME,
  CONTENTFUL_SPACE_ID,
  CONTENTFUL_ACCESS_TOKEN,
  NODE_ENV,
  FIXIE_URL,
} = process.env
const simpleParser = mailparser.simpleParser

app.use(express.static(path.join(__dirname, '/')))

cron.schedule('* * * * *', async () => {
  const instagramLogin = async () => {
    const client = new Instagram(
      {
        username: IG_USERNAME,
        password: IG_PASSWORD,
      },
      {
        language: 'en-US',
        proxy: NODE_ENV === 'production' ? FIXIE_URL : undefined,
      }
    )

    const instagramPostPicture = await client
      .getPhotosByUsername({ username: IG_USERNAME })
      .then((res: any) => {
        const media = res.user.edge_owner_to_timeline_media
        media.edges.map((edge: any) => {
          edge.node.edge_media_to_caption.edges[0].node.text
        })[0]
      })
      .then((mostRecent: any) => {
        Number(mostRecent.split(' - ')[0])
      })
      .then((latestNumber: any) => {
        const updatedNumber = latestNumber + 1

        const inkyDoodleQuery = `
        query {
          inkyDoodleCollection(where: {number: ${updatedNumber}}) {
            items {
              sys {
                id
              }
              number,
              generation,
              name,
              parents,
              image {
                url
              }
            }
          }
        }
      `

        axios({
          url: `https://graphql.contentful.com/content/v1/space/${CONTENTFUL_SPACE_ID}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CONTENTFUL_ACCESS_TOKEN}`,
          },
          data: { query: inkyDoodleQuery },
        })
          .then((res) => res.data)
          .then(({ data, errors }) => {
            if (errors) return console.error(errors)
            const updatedInkyDoodle = data.inkyDoodleCollection.items[0]
            if (updatedInkyDoodle) {
              const updatedCaption = `${updatedNumber} - ${updatedInkyDoodle.name}\n${
                updatedInkyDoodle.parents
                  ? updatedInkyDoodle.parents.length > 0
                    ? updatedInkyDoodle.parents
                        .map((parent: any) => '#' + parent)
                        .join(' + ') + ' \n'
                    : ''
                  : ''
              }#inkyDoodle #gen${updatedInkyDoodle.generation}`

              jimp
                .read(updatedInkyDoodle.image.url)
                .then((lenna) => {
                  return lenna
                    .resize(405, 405, jimp.RESIZE_NEAREST_NEIGHBOR)
                    .quality(100)
                    .write(`./${updatedInkyDoodle.name}.jpg`, async () => {
                      await client
                        .uploadPhoto({
                          photo: `${updatedInkyDoodle.name}.jpg`,
                          caption: updatedCaption,
                          post: 'feed',
                        })
                        .then(({ media }: { media: any }) => {
                          console.log(`https://www.instagram.com/p/${media.code}`)

                          const contentfulClient = contentful.createClient({
                            accessToken: CONTENTFUL_ACCESS_TOKEN
                              ? CONTENTFUL_ACCESS_TOKEN
                              : '',
                          })
                          contentfulClient
                            .getSpace(CONTENTFUL_SPACE_ID ? CONTENTFUL_SPACE_ID : '')
                            .then((space) => {
                              space.getEnvironment('master').then((env) => {
                                env
                                  .getEntry(updatedInkyDoodle.sys.id)
                                  .then((entry: any) => {
                                    entry.fields.instagram = {
                                      'en-US': {
                                        url: `https://www.instagram.com/p/${media.code}`,
                                        date: dayjs().format('MMMM D, YYYY'),
                                      },
                                    }
                                    entry.update().then(() => {
                                      env
                                        .getEntry(updatedInkyDoodle.sys.id)
                                        .then((updatedEntry) => {
                                          updatedEntry.publish()
                                          console.log(
                                            `Entry updated successfully and published. New updated entry Instagram link is ${updatedEntry.fields.instagram['en-US'].url}`
                                          )
                                        })
                                    })
                                  })
                              })
                            })

                          fs.unlinkSync(`${updatedInkyDoodle.name}.jpg`)
                        })
                    })
                })
                .catch((error) => console.error(error))
            }
          })
      })

    try {
      console.info('Logging in..')
      await client.login()
      console.info('Login successful!')

      const delayedInstagramPost = async (timeout: number) => {
        setTimeout(async () => {
          await instagramPostPicture()
        }, timeout)
      }
      await delayedInstagramPost(55000)
    } catch (err) {
      const { error, status } = err

      console.error('Login failed..')
      if (status === 403) {
        console.error('Throttled!')
        return
      }
      console.error(error)
      if (error && error.message === 'checkpoint_required') {
        const challengeUrl = error.checkpoint_required
        await client.updateChallenge({ challengeUrl, choices: 1 })
        const emailConfig = {
          imap: {
            user: EMAIL_USERNAME ? EMAIL_USERNAME : '',
            password: IG_PASSWORD ? IG_PASSWORD : '',
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
              servername: 'imap.gmail.com',
              rejectUnauthorized: false,
            },
            authTimeout: 30000,
          },
        }

        const delayedEmail = async (timeout: number) => {
          setTimeout(() => {
            imap.connect(emailConfig).then(async (connection) => {
              return connection.openBox('INBOX').then(async () => {
                const delay = 1 * 3600 * 1000
                const lastHour = new Date()
                lastHour.setTime(Date.now() - delay)
                const lsHour = lastHour.toISOString()
                const searchCriteria = ['ALL', 'SINCE', lsHour]
                const fetchOptions = {
                  bodies: [''],
                }
                return connection
                  .search(searchCriteria, fetchOptions)
                  .then((messages) => {
                    messages.forEach((item) => {
                      const all = _.find(item.parts, { which: '' })
                      const id = item.attributes.uid
                      const idHeader = `Imap-Id: ${id}\r\n`
                      simpleParser(idHeader + all?.body, async (err, mail) => {
                        if (err) {
                          console.error(err)
                          return
                        }
                        console.log(mail.subject)

                        const answerCodeArr = mail.text
                          ?.split('\n')
                          .filter((item) => item && /^\S+$/.test(item))

                        if (answerCodeArr && mail.text?.includes('Instagram')) {
                          if (answerCodeArr.length > 0) {
                            const answerCode = answerCodeArr[0]
                            console.log(answerCode)
                            await client.updateChallenge({
                              challengeUrl,
                              securityCode: answerCode,
                            })
                            console.info(
                              `Answered instagram security challenge with answer code: ${answerCode}`
                            )
                            await client.login()
                            await instagramLogin()
                          }
                        }
                      })
                    })
                  })
              })
            })
          }, timeout)
        }
        await delayedEmail(45000)
      }
    }
  }
  await instagramLogin()
})

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('welcome..')
})

const port = process.env.PORT || 9999
app.listen(port, () => `Server is running on port: ${port}`)
