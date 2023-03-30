import Link from 'next/link';

const Nav = () => {
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Home
          </Link>
          <Link href='/txbuilder' className="navitems">
            Build Transaction
          </Link>
          <Link href='/transactions' className="navitems">
            Transaction History
          </Link>
    </nav>
  );
};

export default Nav;