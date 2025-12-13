export type NotificationType = "success" | "info" | "warning" | "danger"

export type Notification = {
  id: string
  message: string
  type: NotificationType
  closing?: boolean
}
