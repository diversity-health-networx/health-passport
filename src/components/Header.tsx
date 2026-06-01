import { Link } from '@tanstack/solid-router'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header class={styles.header}>
      <nav class={styles.nav}>
        <h2 class={styles.brandTitle}>
          <Link to="/" class={styles.brandLink}>
            <span class={styles.brandDot} />
            Health Passport
          </Link>
        </h2>

        <div class={styles.navLinks}>
          <Link
            to="/"
            class={styles.navLink}
            activeProps={{ class: styles.navLinkActive }}
          >
            Home
          </Link>
          <Link
            to="/admin/forms"
            class={styles.navLink}
            activeProps={{ class: styles.navLinkActive }}
          >
            Admin
          </Link>
          <Link
            to="/admin/settings"
            class={styles.navLink}
            activeProps={{ class: styles.navLinkActive }}
          >
            Settings
          </Link>
          <a href="/admin/login" class={styles.navLink}>
            Login
          </a>
        </div>
      </nav>
    </header>
  )
}