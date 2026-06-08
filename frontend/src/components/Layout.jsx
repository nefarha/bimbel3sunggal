import Header from './Header';
import Footer from './Footer';
import ChatButton from './ChatButton';

function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <ChatButton />
    </div>
  );
}

export default Layout;
