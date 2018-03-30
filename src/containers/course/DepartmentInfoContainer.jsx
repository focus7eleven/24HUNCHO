import React from 'react'
import styles from './DepartmentInfoContainer.scss'

class DepartmentInfoContainer extends React.Component {
  state = {
    currentCover: null,
    coverList: [],
  }

  handleSelectCover = (index) => {

  }

  render() {
    const { currentCover } = this.state

    return (
      <div className={styles.container}>
        <div className={styles.coverContainer}>
          <div className={styles.cover}>
            {
              currentCover ?
              <img src={currentCover} />
              :
              <div className={styles.defaultCover}></div>
            }
          </div>
          <div className={styles.preview}>

          </div>
        </div>
        <div className={styles.description}>
          南京大学软件学院是南京大学所属的教学研究型工科学院，是国家计委和教育部2002年首批批准设立的国家级示范性软件学院。
          学院现设有软件工程系、信息系统工程系、嵌入式技术系，以及国家级Linux技术培训与推广中心（教育部/科技部）、国家软件人才国际培训（南京）基地（国家外专局）、江苏省服务外包人才培训基地。
        </div>
      </div>
    )
  }
}

export default DepartmentInfoContainer
