export type JobStatusMessages = {
  pending: string
  running: string
  error: {
    title: string
    message: string
  }
}
