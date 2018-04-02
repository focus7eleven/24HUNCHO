import oss from "oss";

export default {
    //获取粘贴的图片并上传至oss
    handleTPaste: function (event, affairId, roleId) {
        if (event.clipboardData && event.clipboardData.items) {
            let items = event.clipboardData.items;
            for(let i = 0; i < items.length; i++) {
                if(/^image\//.test(items[i].type)) {
                    //图片
                    event.preventDefault();
                    let file = items[i].getAsFile();
                    this.handleSendMessage();
                    this.imageUpload([file], affairId, roleId)
                }
            }
        }
    },

    //上传聊天图片
    imageUpload: function (myFiles, affairId, roleId) {
        let hasImg = false
        if (myFiles.length > 0) {
            myFiles.map((file) => {
                if (file && /^image/.test(file.type)) {
                    hasImg = true
                    oss.uploadChatFile(file, affairId, roleId).then((url) => {
                      let imageUrl = url;
                      if (imageUrl) {
                        this.handleSendImage(imageUrl);
                      }else {
                          new Error('upload to oss error')
                      }
                    }).catch((error) => {
                        console.log(error);
                        return false;
                    })
                    return true
                }
            })
        } else {
            new Error('No files to upload for this field')
        }
        return hasImg
    },
}
