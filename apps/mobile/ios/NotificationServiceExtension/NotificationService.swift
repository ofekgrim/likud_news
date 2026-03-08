import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // Try to get imageUrl from data payload or fcm_options
        let imageUrlString = bestAttemptContent.userInfo["imageUrl"] as? String
            ?? (bestAttemptContent.userInfo["fcm_options"] as? [String: Any])?["image"] as? String

        guard let urlString = imageUrlString,
              let url = URL(string: urlString) else {
            contentHandler(bestAttemptContent)
            return
        }

        downloadImage(from: url) { attachment in
            if let attachment = attachment {
                bestAttemptContent.attachments = [attachment]
            }
            contentHandler(bestAttemptContent)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

    private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { location, response, error in
            guard error == nil,
                  let location = location,
                  let response = response as? HTTPURLResponse,
                  response.statusCode == 200 else {
                completion(nil)
                return
            }

            // Determine file extension from MIME type
            let ext: String
            switch response.mimeType {
            case "image/png": ext = "png"
            case "image/gif": ext = "gif"
            case "image/webp": ext = "webp"
            default: ext = "jpg"
            }

            let tempFile = URL(fileURLWithPath: NSTemporaryDirectory())
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension(ext)

            do {
                try FileManager.default.moveItem(at: location, to: tempFile)
                let attachment = try UNNotificationAttachment(
                    identifier: "notification-image",
                    url: tempFile,
                    options: nil
                )
                completion(attachment)
            } catch {
                completion(nil)
            }
        }
        task.resume()
    }
}
