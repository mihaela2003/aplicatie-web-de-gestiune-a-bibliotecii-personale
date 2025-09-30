import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Register from "../Register";
import Login from "../Login";
import Navbar from "../Navbar";
import UserProfile from "../UserProfile";
import HomePage from "../HomePage";
import ReadingChallenges from "../ReadingChallenges";
import Statistics from "../Statistics";
import BookDetails from "../BookDetails";
import BookListPage from "../BookListPage";
import Author from "../Author";
import Review from "../Review";
import ManageAccount from "../ManageAccount";
import OwnedBook from "../OwnedBook";
import MyLibrary from "../MyLibrary";
import ReadingChallengeDetails from "../ReadingChallengeDetails";
import ReadingChallengeForm from "../ReadingChallengeForm";
import Notification from "../Notifications";
import FriendsList from "../FriendsList";
import SearchChallenge from "../SearchChallenge";
import AddBookQuest from "../AddBookQuest";
import ResetPassword from "../ResetPassword";
import Achievements from "../Achievements";
import "./App.css";

function AppContent() {
  const location = useLocation();
const hideNavbar = location.pathname === "/login" || location.pathname === "/register" || location.pathname.startsWith("/reset-password");
  return (
    <>
       {!hideNavbar && <Navbar />}
       <div className={!hideNavbar ? "main-content" : ""}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/userprofile" element={<UserProfile />} />
        <Route path="/readingchallenges" element={<ReadingChallenges />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/author/:authorName" element={<Author/>} />
        <Route path="/:status" element={<BookListPage/>} />
        <Route path="/book/:id/review" element={<Review/>} />
        <Route path="/manageaccount" element={<ManageAccount/>} />
        <Route path="/ownedbookformular/:bookId" element={<OwnedBook/>} />
        <Route path="/mylibrary" element={<MyLibrary/>} />
        <Route path="/challengedetails/:id" element={<ReadingChallengeDetails/>} />
        <Route path="/readingchallenges/challengeform" element={<ReadingChallengeForm/>} />
        <Route path="/notification" element={<Notification/>} />
        <Route path="/friendsList/:userId" element={<FriendsList/>} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/challengedetails/:id/edit" element={<ReadingChallengeForm editMode={true} />} />
        <Route path="/readingchallenges/searchChallenge" element={<SearchChallenge />} />
        <Route path="/addBookQuest/:challengeId/:questId" element={<AddBookQuest />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/achievements/:userId" element={<Achievements/>} />
      </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
