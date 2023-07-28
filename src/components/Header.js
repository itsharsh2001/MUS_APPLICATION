import React from 'react'
import classes from './Header.module.css'

function Header() {
  return (
    <header className={classes.header}>
        <span>
            {/* <img src="/menu.png" alt="" /> */}
            <img src="/gtlogo.png" alt="" />
        </span>
        {/* <span>
            <img src="/user.png" alt="" />
            <p>Chris Swanson</p>
            <img src="/logout.png" alt="" />
        </span> */}
    </header>
  )
}

export default Header